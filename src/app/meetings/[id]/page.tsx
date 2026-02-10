"use client";

/**
 * Meeting Room Page - Full Video Conferencing Interface
 * 
 * Features:
 * - Video/Audio controls
 * - Screen sharing
 * - Participant grid
 * - Real-time chat
 * - Meeting controls
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useMeetingStore } from '@/lib/store/meetingStore';
import { meetingAPI } from '@/lib/api/meetingAPI';
import socketClient from '@/lib/websocket/socketClient';
import * as webrtc from '@/lib/webrtc/peerConnection';
import { useWebRTC } from '@/lib/webrtc/useWebRTC';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { TranscriptViewer } from '@/components/meetings/TranscriptViewer';
import type { Socket } from 'socket.io-client';

interface Participant {
    user_id: string;
    username: string;
    joined_at: string;
}

interface JoinRequest {
    id: string;
    user_id: string;
    username: string;
    message?: string;
    status: string;
    created_at: string;
}

interface PeerData {
    peerConnection: RTCPeerConnection;
    stream: MediaStream | null;
}

export default function MeetingRoomPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const meetingId = params.id as string;
    const channelId = searchParams.get('channel');
    const channelTitle = searchParams.get('title');

    const [isInitializing, setIsInitializing] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [meetingData, setMeetingData] = useState<any>(null);
    const [apiParticipants, setApiParticipants] = useState<Participant[]>([]);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<Array<{ id: string, sender: string, message: string, timestamp: string, role?: string, user_id?: string, email?: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [meetingStatus, setMeetingStatus] = useState<string>('active'); // NEW: Track status
    const [transcriptSegments, setTranscriptSegments] = useState<Array<any>>([]);
    const [activeTab, setActiveTab] = useState<'chat' | 'transcript'>('chat');

    // WebRTC State
    const [peerConnections, setPeerConnections] = useState<Map<string, PeerData>>(new Map());
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [participantStatus, setParticipantStatus] = useState<Map<string, { mic: boolean, camera: boolean }>>(new Map());
    const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set()); // Track who is speaking

    const videoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioAnalyzersRef = useRef<Map<string, AnalyserNode>>(new Map());
    const localAnalyzerRef = useRef<AnalyserNode | null>(null);
    const peerConnectionsRef = useRef<Map<string, PeerData>>(new Map()); // NEW: Ref for stable access

    const {
        localStream,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        isInMeeting,
        participants,
        setLocalStream,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        setInMeeting,
        leaveMeeting,
    } = useMeetingStore();

    // Initialize WebRTC for peer-to-peer video/audio
    const { sendChatMessage, broadcastMicStatus, broadcastCameraStatus } = useWebRTC({
        meetingId,
        userId: currentUserId,
        username: currentUserEmail || currentUserId, // User email for chat display
        userRole: currentUserRole,
        userEmail: currentUserEmail,
        localStream,
        peerConnections,
        setPeerConnections,
        peerConnectionsRef, // Pass ref to hook
        setRemoteStreams,
        setParticipantStatus,
        setChatMessages,
        socketRef,
        onUserJoined: (data: { user_id: string; username: string; session_id: string }) => {
            // Immediately add to participants list when user joins via WebSocket
            console.log(`✅ Adding user to participants: ${data.username}`);
            setApiParticipants(prev => {
                // Check if already exists
                const exists = prev.some(p => p.user_id === data.user_id);
                if (exists) {
                    console.log(`⚠️ User ${data.username} already in participants`);
                    return prev;
                }
                // Add new participant
                return [...prev, {
                    user_id: data.user_id,
                    username: data.username,
                    joined_at: new Date().toISOString(),
                }];
            });
        },
        onUserLeft: (data: { user_id: string; username: string }) => {
            // Remove from participants list when user leaves via WebSocket
            console.log(`❌ Removing user from participants: ${data.username}`);
            setApiParticipants(prev => prev.filter(p => p.user_id !== data.user_id));
        },
    });

    // Speech Recognition Integration
    const { error: speechError } = useSpeechRecognition({
        isListening: isAudioEnabled && isInMeeting, // Only listen when mic is ON and in meeting
        minConfidence: 0.8, // Require 80% confidence to avoid "ghost" transcripts
        onResult: (text, isFinal) => {
            // Send finalized speech to server
            if (isFinal) {
                console.log('🗣️ Unmute & Speech detected:', text);
                socketClient.sendTranscriptSegment(text, true);
            }
        },
    });

    // Log speech errors if any
    useEffect(() => {
        if (speechError) {
            console.warn('⚠️ Speech recognition error:', speechError);
        }
    }, [speechError]);

    // Callback ref to set video srcObject when element mounts
    const setVideoRef = React.useCallback((element: HTMLVideoElement | null) => {
        // Store the ref
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = element;

        // Set srcObject when element is available and we have a stream
        if (element && localStream) {
            if (element.srcObject !== localStream) {
                element.srcObject = localStream;
                console.log('✅ Video srcObject set successfully via callback ref');
            }
        }
    }, [localStream]);

    // Update video element when local stream changes
    useEffect(() => {
        if (videoRef.current && localStream) {
            if (videoRef.current.srcObject !== localStream) {
                videoRef.current.srcObject = localStream;
                console.log('✅ Video srcObject updated via effect');
            }
        }
    }, [localStream, isVideoEnabled]);

    // Initialize meeting on mount
    useEffect(() => {
        // Get current user ID FIRST before anything else
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('auth-storage');
            if (token) {
                let actualToken = token;

                // Parse auth-storage if needed
                if (token.startsWith('{')) {
                    const parsed = JSON.parse(token);
                    actualToken = parsed.state?.accessToken || token;
                }

                const payload = JSON.parse(atob(actualToken.split('.')[1]));
                const userId = payload.user_id || payload.sub || '';
                const userEmail = payload.email || payload.username || userId;
                const userRole = payload.role || 'Participant';

                setCurrentUserId(userId);
                setCurrentUserEmail(userEmail);
                setCurrentUserRole(userRole);
                console.log('👤 Current user:', userId, userEmail, userRole);
            }
        } catch (error) {
            console.error('Failed to decode token:', error);
        }

        // Only initialize once
        initializeMeeting();
        loadMeetingData();

        // Poll for participant updates every 3 seconds
        const participantInterval = setInterval(() => {
            loadMeetingData();
        }, 3000);

        return () => {
            clearInterval(participantInterval);
            // Cleanup on unmount
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Run only once

    // Separate effect for host polling
    useEffect(() => {
        const requestInterval = setInterval(() => {
            if (isHost) {
                loadJoinRequests();
            }
        }, 5000);

        return () => clearInterval(requestInterval);
    }, [isHost, meetingId]);

    // Update video element when local stream changes
    useEffect(() => {
        console.log('📹 Video state changed:');
        console.log('  localStream:', localStream ? 'Available' : 'None');
        console.log('  isVideoEnabled:', isVideoEnabled);
        console.log('  videoRef.current:', videoRef.current ? 'Present' : 'Missing');

        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
            console.log('✅ Video srcObject set successfully');
        }
    }, [localStream, isVideoEnabled]);

    // Audio detection for local stream (detect when YOU are speaking)
    useEffect(() => {
        if (!localStream || !isAudioEnabled) {
            // Remove self from speaking users if mic is off
            setSpeakingUsers(prev => {
                const next = new Set(prev);
                next.delete(currentUserId);
                return next;
            });
            return;
        }

        try {
            // Create audio context if not exists
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            const audioContext = audioContextRef.current;
            const source = audioContext.createMediaStreamSource(localStream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 512;
            analyzer.smoothingTimeConstant = 0.8;

            source.connect(analyzer);
            localAnalyzerRef.current = analyzer;

            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            let speakingTimeout: NodeJS.Timeout;
            let lastSpeakingState = false;  // Track last state to avoid duplicate socket emits

            const checkAudioLevel = () => {
                analyzer.getByteFrequencyData(dataArray);

                // Calculate average volume
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

                // Threshold for speaking (adjust as needed)
                const SPEAKING_THRESHOLD = 20;

                if (average > SPEAKING_THRESHOLD) {
                    // User is speaking
                    setSpeakingUsers(prev => {
                        const next = new Set(prev);
                        next.add(currentUserId);
                        return next;
                    });

                    // Emit speaking status to other users (only if not already speaking)
                    if (!lastSpeakingState) {
                        lastSpeakingState = true;
                        socketClient.sendSpeakingStatus(true);
                    }

                    // Clear existing timeout
                    clearTimeout(speakingTimeout);

                    // Set timeout to remove speaking indicator after silence
                    speakingTimeout = setTimeout(() => {
                        setSpeakingUsers(prev => {
                            const next = new Set(prev);
                            next.delete(currentUserId);
                            return next;
                        });

                        // Emit stopped speaking
                        if (lastSpeakingState) {
                            lastSpeakingState = false;
                            socketClient.sendSpeakingStatus(false);
                        }
                    }, 500);
                }

                requestAnimationFrame(checkAudioLevel);
            };

            checkAudioLevel();

            return () => {
                clearTimeout(speakingTimeout);
                source.disconnect();
                // Emit stopped speaking on cleanup
                if (lastSpeakingState) {
                    socketClient.sendSpeakingStatus(false);
                }
            };
        } catch (error) {
            console.error('Error setting up audio detection:', error);
        }
    }, [localStream, isAudioEnabled, currentUserId]);

    // Audio detection for remote streams
    useEffect(() => {
        const analyzers = audioAnalyzersRef.current;

        remoteStreams.forEach((stream, userId) => {
            if (analyzers.has(userId)) return; // Already monitoring

            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new AudioContext();
                }

                const audioContext = audioContextRef.current;
                // Clone the stream to prevent hijacking the audio from the <audio> element
                // createMediaStreamSource can mute the original stream in some browsers
                const clonedStream = stream.clone();
                const source = audioContext.createMediaStreamSource(clonedStream);
                const analyzer = audioContext.createAnalyser();
                analyzer.fftSize = 512;
                analyzer.smoothingTimeConstant = 0.8;

                source.connect(analyzer);
                analyzers.set(userId, analyzer);

                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                let speakingTimeout: NodeJS.Timeout;

                const checkAudioLevel = () => {
                    analyzer.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    const SPEAKING_THRESHOLD = 20;

                    if (average > SPEAKING_THRESHOLD) {
                        setSpeakingUsers(prev => {
                            const next = new Set(prev);
                            next.add(userId);
                            return next;
                        });

                        clearTimeout(speakingTimeout);
                        speakingTimeout = setTimeout(() => {
                            setSpeakingUsers(prev => {
                                const next = new Set(prev);
                                next.delete(userId);
                                return next;
                            });
                        }, 500);
                    }

                    requestAnimationFrame(checkAudioLevel);
                };

                checkAudioLevel();
            } catch (error) {
                console.error('Error setting up remote audio detection:', error);
            }
        });

        // Cleanup removed streams
        analyzers.forEach((analyzer, userId) => {
            if (!remoteStreams.has(userId)) {
                analyzers.delete(userId);
                setSpeakingUsers(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            }
        });
    }, [remoteStreams]);

    // Listen for speaking events from other users via socket (backup for when WebRTC audio doesn't work)
    useEffect(() => {
        const socket = socketClient.getSocket();
        if (!socket) return;

        const handleUserSpeaking = (data: { user_id: string; username: string; speaking: boolean }) => {
            console.log(`🗣️ User speaking event: ${data.username} (${data.user_id}) speaking=${data.speaking}`);

            setSpeakingUsers(prev => {
                const next = new Set(prev);
                if (data.speaking) {
                    next.add(data.user_id);
                } else {
                    next.delete(data.user_id);
                }
                return next;
            });
        };

        socket.on('user-speaking', handleUserSpeaking);

        return () => {
            socket.off('user-speaking', handleUserSpeaking);
        };
    }, []);


    // Convert chat messages to transcript segments (group consecutive messages from same speaker)
    useEffect(() => {
        const segments: any[] = [];
        let currentSegment: any = null;

        chatMessages.forEach((msg) => {
            const userId = msg.user_id || msg.sender;
            const username = msg.sender;
            const role = msg.role || 'Participant';

            // Format timestamp
            let timeDisplay = msg.timestamp;
            try {
                const dt = new Date(msg.timestamp);
                timeDisplay = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } catch {
                // Keep original if parsing fails
            }

            // Check if we should start a new segment
            if (!currentSegment || currentSegment.user_id !== userId) {
                // Save previous segment
                if (currentSegment) {
                    segments.push(currentSegment);
                }

                // Start new segment
                currentSegment = {
                    user_id: userId,
                    username: username,
                    role: role,
                    timestamp: timeDisplay,
                    messages: [msg.message],
                };
            } else {
                // Add to current segment
                currentSegment.messages.push(msg.message);
            }
        });

        // Don't forget the last segment
        if (currentSegment) {
            segments.push(currentSegment);
        }

        setTranscriptSegments(segments);
    }, [chatMessages]);

    // Export transcript function
    const handleExportTranscript = (format: 'txt' | 'json') => {
        if (format === 'txt') {
            // Create Teams-style text format
            const lines = [];
            lines.push('================================================================================');
            lines.push('MEETING TRANSCRIPT');
            lines.push('================================================================================');
            lines.push(`Meeting: "${channelTitle || meetingData?.title || 'Untitled Meeting'}"`);
            lines.push(`Date: ${new Date().toLocaleString()}`);
            lines.push(`Participants: ${apiParticipants.length}`);
            lines.push('');

            if (apiParticipants.length > 0) {
                lines.push('ATTENDEES:');
                apiParticipants.forEach(p => {
                    lines.push(`- ${p.username}`);
                });
                lines.push('');
            }

            lines.push('================================================================================');
            lines.push('CONVERSATION');
            lines.push('================================================================================');
            lines.push('');

            transcriptSegments.forEach(segment => {
                const roleDisplay = segment.role && segment.role !== 'Participant' ? ` (${segment.role})` : '';
                lines.push(`[${segment.timestamp}] ${segment.username}${roleDisplay}`);
                segment.messages.forEach((msg: string) => {
                    lines.push(msg);
                });
                lines.push('');
            });

            const content = lines.join('\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transcript-${meetingId.slice(0, 8)}-${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'json') {
            const data = {
                meeting_id: meetingId,
                meeting_title: channelTitle || meetingData?.title || 'Untitled Meeting',
                date: new Date().toISOString(),
                participants: apiParticipants,
                transcript: transcriptSegments,
            };

            const content = JSON.stringify(data, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transcript-${meetingId.slice(0, 8)}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };


    const loadMeetingData = async () => {
        try {
            const response = await meetingAPI.getMeeting(meetingId);
            console.log('📊 Meeting data loaded:', response);

            if (response.success && response.data) {
                setMeetingData(response.data);

                // Check if current user is host
                const token = localStorage.getItem('access_token');
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const userId = payload.user_id || payload.sub;
                    setIsHost(response.data.created_by_user_id === userId);
                }

                if (response.data.status === 'ended') {
                    alert('This meeting has ended.');
                    router.push('/chat');
                    return;
                }

                setMeetingStatus(response.data.status);

                // Load participants
                const partResponse = await meetingAPI.getParticipants(meetingId);
                console.log('👥 Participants response:', partResponse);

                if (partResponse.success && partResponse.data) {
                    console.log('✅ Participant count:', partResponse.data.participants.length);
                    setApiParticipants(partResponse.data.participants);
                } else {
                    console.warn('⚠️ No participants data in response');
                }
            }
        } catch (error) {
            console.error('❌ Failed to load meeting data:', error);
        }
    };

    const loadJoinRequests = async () => {
        try {
            const response = await meetingAPI.getJoinRequests(meetingId);
            if (response.success && response.data) {
                setJoinRequests(response.data.requests);
            }
        } catch (error) {
            // Silently fail - user might not be host
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        try {
            await meetingAPI.processJoinRequest(meetingId, requestId, 'approve');
            await loadJoinRequests();
            await loadMeetingData(); // Refresh participants
        } catch (error) {
            console.error('Failed to approve request:', error);
            alert('Failed to approve join request');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            await meetingAPI.processJoinRequest(meetingId, requestId, 'reject');
            await loadJoinRequests();
        } catch (error) {
            console.error('Failed to reject request:', error);
            alert('Failed to reject join request');
        }
    };

    const initializeMeeting = async () => {
        setIsInitializing(true);
        try {
            // Request camera and microphone permissions
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            setLocalStream(stream);
            setInMeeting(true);

            // Auto-join as participant
            await autoJoinMeeting();

        } catch (error: any) {
            console.error('Failed to access media devices:', error);

            // Try audio-only if video fails (common when camera is used by another app)
            try {
                console.log('📹 Video failed, trying audio-only...');
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

                setLocalStream(audioStream);
                setInMeeting(true);
                alert('Camera unavailable (may be used by another browser). Joining with audio only.');
                await autoJoinMeeting();

            } catch (audioError) {
                console.error('Audio-only also failed:', audioError);

                // Provide specific error messages
                if (error.name === 'NotAllowedError') {
                    alert('Camera/Microphone permission denied. Please allow access in your browser settings.');
                } else if (error.name === 'NotFoundError') {
                    alert('No camera or microphone found on this device.');
                } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
                    alert('Camera/Microphone is being used by another application. Please close other video apps or browsers using the camera.');
                } else {
                    alert('Failed to access camera/microphone. Please check permissions and try again.');
                }
            }
        } finally {
            setIsInitializing(false);
        }
    };

    const autoJoinMeeting = async () => {
        try {
            // Get token (same logic as meetingAPI.ts getToken function)
            let token: string | null = null;

            // Try Zustand auth storage first
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
                try {
                    const parsed = JSON.parse(authStorage);
                    if (parsed.state?.accessToken) {
                        token = parsed.state.accessToken;
                    }
                } catch (e) {
                    console.warn('Failed to parse auth-storage:', e);
                }
            }

            // Fallback to direct access_token
            if (!token) {
                token = localStorage.getItem('access_token');
            }

            if (!token) {
                console.error('❌ No access token found in auth-storage or access_token!');
                return;
            }

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.user_id || payload.sub;
            const username = payload.email || payload.username || 'User';

            console.log('🔑 Token found and decoded');
            console.log('👤 Extracted userId:', userId);
            console.log('📧 Extracted username:', username);
            console.log('🚀 Auto-joining meeting as:', username, 'with ID:', userId);

            // Add self as participant
            const response = await meetingAPI.addParticipant(meetingId, userId, username);
            console.log('📥 Add participant response:', response);

            console.log('✅ Successfully joined as participant');

            // Reload participant list
            await loadMeetingData();
        } catch (error) {
            console.error('⚠️ Auto-join failed:', error);
            console.error('⚠️ Error details:', error instanceof Error ? error.message : String(error));
            // Don't alert - user might already be a participant
        }
    };

    const handleLeaveMeeting = async () => {
        if (confirm('Are you sure you want to leave this meeting?')) {
            // If host, ask about ending meeting
            if (isHost) {
                const endMeeting = confirm('As the host, do you want to END the meeting for everyone? (Cancel to just leave)');
                if (endMeeting) {
                    await handleEndMeeting();
                    return;
                }
            }

            leaveMeeting();
            router.push('/chat');
        }
    };

    const handleEndMeeting = async () => {
        try {
            // End meeting FIRST (so "Meeting Ended" message appears first)
            await meetingAPI.endMeeting(meetingId);

            // Then store transcript (so "Meeting Summary" appears second)
            // Generate formatted transcript
            let transcriptLines = [`Meeting "${meetingData?.title}" ended at ${new Date().toISOString()}`];
            transcriptLines.push(`Participants: ${apiParticipants.length}`);
            transcriptLines.push('---');

            // Add participants list
            if (apiParticipants.length > 0) {
                transcriptLines.push('Attendees:');
                apiParticipants.forEach(p => {
                    // We might not have roles for all API participants unless we fetch them, 
                    // but we can list names/emails.
                    transcriptLines.push(`- ${p.username}`);
                });
                transcriptLines.push('---');
            }

            // Add chat history
            transcriptLines.push('Transcript:');
            chatMessages.forEach(msg => {
                const roleDisplay = msg.role ? `(${msg.role})` : '';
                transcriptLines.push(`[${msg.timestamp}] ${msg.sender} ${roleDisplay}: ${msg.message}`);
            });

            const transcript = transcriptLines.join('\n');

            await meetingAPI.storeTranscript(meetingId, transcript, 'text', {
                participants: apiParticipants.length,
                duration: 'N/A',
                ended_by: currentUserId
            });

            leaveMeeting();
            router.push('/chat');
        } catch (error) {
            console.error('Failed to end meeting:', error);
            alert('Failed to end meeting');
        }
    };

    const handleToggleAudio = () => {
        toggleAudio();
        broadcastMicStatus(!isAudioEnabled);
    };

    const handleToggleVideo = () => {
        toggleVideo();
        broadcastCameraStatus(!isVideoEnabled);
    };

    const handleToggleScreenShare = async () => {
        await toggleScreenShare();
    };

    const handleSendMessage = () => {
        if (chatInput.trim()) {
            sendChatMessage(chatInput.trim());
            setChatInput('');
        }
    };

    const handleChatKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (isInitializing) {
        return (
            <div className="h-screen w-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-white mb-2">Joining Meeting...</h2>
                    <p className="text-gray-400">Setting up your camera and microphone</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-lg font-semibold text-white">
                            {channelTitle || 'Meeting'}
                        </h1>
                        <p className="text-sm text-gray-400">Meeting ID: {meetingId.slice(0, 20)}...</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Connection Status */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${socketRef.current?.connected
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${socketRef.current?.connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                            }`} />
                        {socketRef.current?.connected ? 'Live' : 'Disconnected'}
                    </div>

                    {/* Participant Count */}
                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {apiParticipants.length}
                    </button>

                    {/* Chat Toggle */}
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Grid */}
                <div className="flex-1 p-4 flex items-center justify-center bg-gray-900">
                    <div className="relative w-full h-full max-w-7xl">
                        {/* Participants Grid - Teams Style */}
                        <div className={`grid gap-4 h-full ${apiParticipants.length === 1 ? 'grid-cols-1' :
                            apiParticipants.length <= 4 ? 'grid-cols-2' :
                                'grid-cols-3'
                            }`}>
                            {/* Local User Video */}
                            <div className={`relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-200 ${speakingUsers.has(currentUserId)
                                ? 'ring-4 ring-green-500 animate-pulse'
                                : ''
                                }`}>
                                {localStream && isVideoEnabled ? (
                                    <video
                                        ref={setVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover mirror"
                                        style={{ transform: 'scaleX(-1)' }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                                        <div className="text-center">
                                            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-2xl font-bold text-white drop-shadow-md">You</p>
                                        </div>
                                    </div>
                                )}

                                {/* Speaking Indicator Badge */}
                                {speakingUsers.has(currentUserId) && (
                                    <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" />
                                        </svg>
                                        Speaking
                                    </div>
                                )}

                                {/* Audio Indicator */}
                                {!isAudioEnabled && (
                                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    </div>
                                )}

                                {/* Name Tag */}
                                <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
                                    You
                                </div>
                            </div>

                            {/* Other Participants - Show all from API */}
                            {apiParticipants
                                .filter(participant => participant.user_id !== currentUserId)
                                .map((participant) => {
                                    const stream = remoteStreams.get(participant.user_id);
                                    const status = participantStatus.get(participant.user_id) || { mic: true, camera: true };

                                    // Check video track state more thoroughly
                                    const videoTrack = stream?.getVideoTracks()[0];
                                    const trackInfo = videoTrack ?
                                        `enabled=${videoTrack.enabled}, readyState=${videoTrack.readyState}, muted=${videoTrack.muted}` :
                                        'no track';

                                    // Show video ONLY if:
                                    // 1. Camera status is on (from WebSocket) OR
                                    // 2. We are receiving actual video data (stream is active and unmuted) - Trust data over signaling!
                                    const hasValidVideoTrack = videoTrack &&
                                        videoTrack.readyState === 'live' &&
                                        !videoTrack.muted;

                                    // Relaxed condition: If we have a valid video track, show it! 
                                    // Sometimes signaling (status.camera) might be out of sync, but if we have video, we should show it.
                                    const shouldShowVideo = (status.camera && stream) || (stream && hasValidVideoTrack);

                                    console.log(`🎥 Participant ${participant.username}: camera=${status.camera}, hasStream=${!!stream}, trackInfo=${trackInfo}, shouldShowVideo=${shouldShowVideo}`);

                                    return (
                                        <div
                                            key={participant.user_id}
                                            className={`relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-200 ${speakingUsers.has(participant.user_id)
                                                ? 'ring-4 ring-green-500 animate-pulse'
                                                : ''
                                                }`}
                                        >
                                            {/* AUDIO ELEMENT - Always render to play remote audio even when video is hidden */}
                                            {stream && (
                                                <audio
                                                    key={`audio-${participant.user_id}`}
                                                    id={`remote-audio-${participant.user_id}`}
                                                    ref={(audio) => {
                                                        if (audio && stream) {
                                                            if (audio.srcObject !== stream) {
                                                                console.log(`🔊 Setting audio srcObject for ${participant.username}`);
                                                                audio.srcObject = stream;
                                                                audio.volume = 1.0;
                                                                audio.muted = false;
                                                                // Force unmute every 2 seconds to overcome browser restrictions
                                                                setInterval(() => {
                                                                    if (audio.muted) {
                                                                        audio.muted = false;
                                                                        audio.volume = 1.0;
                                                                    }
                                                                    if (audio.paused) {
                                                                        audio.play().catch(() => { });
                                                                    }
                                                                }, 2000);
                                                            }
                                                            // Ensure playing
                                                            if (audio.paused) {
                                                                audio.play().catch(err => {
                                                                    console.warn(`⚠️ Audio autoplay blocked for ${participant.username}:`, err);
                                                                });
                                                            }
                                                        }
                                                    }}
                                                    autoPlay
                                                    muted={false}
                                                    style={{ display: 'none' }}
                                                    onLoadedData={(e) => {
                                                        const audio = e.target as HTMLAudioElement;
                                                        audio.volume = 1.0;
                                                        audio.muted = false;
                                                        audio.play().catch(err => console.log('🔊 Audio play on load:', err.message));
                                                    }}
                                                    onCanPlay={(e) => {
                                                        const audio = e.target as HTMLAudioElement;
                                                        audio.muted = false;
                                                        audio.volume = 1.0;
                                                        audio.play().catch(err => console.log('🔊 Audio play on can play:', err.message));
                                                    }}
                                                />
                                            )}

                                            {shouldShowVideo ? (
                                                <video
                                                    key={`video-${participant.user_id}-${videoTrack?.id || 'no-track'}-${videoTrack?.muted}-${videoTrack?.enabled}`}
                                                    ref={(video) => {
                                                        if (video && stream) {
                                                            try {
                                                                // Always update srcObject if different, or if we suspect it needs a kick
                                                                if (video.srcObject !== stream) {
                                                                    console.log(`🎬 Setting video srcObject for ${participant.username}`);
                                                                    video.srcObject = stream;
                                                                }

                                                                // Enforce properties
                                                                video.playsInline = true;
                                                                video.autoplay = true;
                                                                video.muted = true; // IMPORTANT: Mute the element so it can autoplay

                                                                // Ensure playback
                                                                if (video.paused) {
                                                                    const playPromise = video.play();
                                                                    if (playPromise !== undefined) {
                                                                        playPromise.catch(err => {
                                                                            console.warn(`⚠️ Video autoplay blocked for ${participant.username}:`, err);
                                                                            // Retry once after a short delay
                                                                            setTimeout(() => {
                                                                                if (video && video.paused) {
                                                                                    video.play().catch(e => console.error('Retry play failed:', e));
                                                                                }
                                                                            }, 1000);
                                                                        });
                                                                    }
                                                                }
                                                            } catch (e) {
                                                                console.error('Error in video ref:', e);
                                                            }
                                                        }
                                                    }}
                                                    autoPlay
                                                    playsInline
                                                    muted={true}  // Mute video element - audio is played by separate <audio> element above
                                                    className="w-full h-full object-cover"
                                                    onLoadedMetadata={(e) => {
                                                        const video = e.target as HTMLVideoElement;
                                                        console.log(`✅ Video metadata loaded for ${participant.username}: ${video.videoWidth}x${video.videoHeight}`);
                                                        video.play().catch(() => { });
                                                    }}
                                                    onCanPlay={(e) => {
                                                        console.log(`▶️ Video can play for ${participant.username}`);
                                                        const video = e.target as HTMLVideoElement;
                                                        video.play().catch(() => { });
                                                    }}
                                                    onPlaying={(e) => {
                                                        const video = e.target as HTMLVideoElement;
                                                        console.log(`🎬 Video playing for ${participant.username}: ${video.videoWidth}x${video.videoHeight}`);
                                                    }}
                                                    onError={(e) => {
                                                        console.error(`❌ Video error for ${participant.username}:`, e);
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                                                    <div className="text-center">
                                                        <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                                            <span className="text-5xl font-bold text-white">
                                                                {participant.username.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="text-2xl font-bold text-white truncate px-4 drop-shadow-md">
                                                            {participant.username.split('@')[0]}
                                                        </p>
                                                        {/* Status text */}
                                                        {!stream ? (
                                                            <p className="text-sm text-white/80 mt-2 font-medium">Waiting for connection...</p>
                                                        ) : videoTrack?.muted ? (
                                                            <p className="text-sm text-yellow-200 mt-2 font-medium animate-pulse">📶 Connecting video...</p>
                                                        ) : !status.camera ? (
                                                            <p className="text-sm text-white/60 mt-2">Camera off</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Speaking Indicator Badge */}
                                            {speakingUsers.has(participant.user_id) && (
                                                <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" />
                                                    </svg>
                                                    Speaking
                                                </div>
                                            )}

                                            {/* Mic Indicator */}
                                            {!status.mic && (
                                                <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                                    </svg>
                                                </div>
                                            )}

                                            {/* Name Tag */}
                                            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium truncate max-w-[calc(100%-24px)]">
                                                {participant.username.split('@')[0]}
                                            </div>

                                            {/* Host Badge */}
                                            {participant.user_id === meetingData?.created_by_user_id && (
                                                <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                                                    HOST
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Waiting Message - Only when alone */}
                        {apiParticipants.length <= 1 && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-6 py-4">
                                    <p className="text-gray-300 text-lg">Waiting for others to join...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat/Transcript Sidebar */}
                {showChat && (
                    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
                        {/* Tabs Header */}
                        <div className="p-4 border-b border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-white">
                                    {activeTab === 'chat' ? 'Meeting Chat' : 'Live Transcript'}
                                </h3>
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Tab Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'chat'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Chat
                                        {chatMessages.length > 0 && (
                                            <span className="px-1.5 py-0.5 bg-blue-500/30 rounded text-xs">
                                                {chatMessages.length}
                                            </span>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('transcript')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'transcript'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Transcript
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'chat' ? (
                            <>
                                {/* Chat Messages */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                    {chatMessages.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center mt-8">No messages yet. Start the conversation!</p>
                                    ) : (
                                        chatMessages.map((msg) => {
                                            const isOwnMessage = msg.sender === currentUserEmail || msg.sender === currentUserId;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`rounded-lg p-3 ${isOwnMessage
                                                        ? 'bg-blue-600/20 border border-blue-500/30'
                                                        : 'bg-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`text-sm font-semibold ${isOwnMessage ? 'text-blue-300' : 'text-blue-400'
                                                            }`}>
                                                            {isOwnMessage ? 'You' : msg.sender}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{msg.timestamp}</span>
                                                    </div>
                                                    <p className="text-sm text-white">{msg.message}</p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Chat Input */}
                                <div className="p-4 border-t border-gray-700">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyPress={handleChatKeyPress}
                                            placeholder="Type a message..."
                                            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Transcript Viewer */
                            <div className="flex-1 overflow-hidden">
                                <TranscriptViewer
                                    segments={transcriptSegments}
                                    currentUserId={currentUserId}
                                    isLive={true}
                                    onExport={handleExportTranscript}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Participants Sidebar */}
                {showParticipants && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-white">
                                    Participants ({apiParticipants.length})
                                </h3>
                                <button
                                    onClick={() => setShowParticipants(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Participants List */}
                            <div className="space-y-2">
                                {apiParticipants.map((participant) => (
                                    <div
                                        key={participant.user_id}
                                        className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg"
                                    >
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm">
                                            {participant.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white">{participant.username}</div>
                                            {participant.user_id === meetingData?.created_by_user_id && (
                                                <div className="text-xs text-gray-400">Host</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Join Requests (Host Only) */}
                            {isHost && joinRequests.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold mb-3 text-yellow-400 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Join Requests ({joinRequests.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {joinRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className="p-3 bg-gray-700 rounded-lg border-2 border-yellow-600"
                                            >
                                                <div className="text-sm font-medium text-white mb-1">
                                                    {request.username}
                                                </div>
                                                {request.message && (
                                                    <div className="text-xs text-gray-400 mb-2">
                                                        "{request.message}"
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApproveRequest(request.id)}
                                                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(request.id)}
                                                        className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
                <div className="flex items-center justify-center gap-4">
                    {/* Microphone Toggle */}
                    <button
                        onClick={handleToggleAudio}
                        className={`p-4 rounded-full transition-all ${isAudioEnabled
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                        title={isAudioEnabled ? 'Mute' : 'Unmute'}
                    >
                        {isAudioEnabled ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        )}
                    </button>

                    {/* Camera Toggle */}
                    <button
                        onClick={handleToggleVideo}
                        className={`p-4 rounded-full transition-all ${isVideoEnabled
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                        title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
                    >
                        {isVideoEnabled ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        )}
                    </button>

                    {/* Screen Share Toggle */}
                    <button
                        onClick={handleToggleScreenShare}
                        className={`p-4 rounded-full transition-all ${isScreenSharing
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                        title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </button>

                    {/* Leave Meeting */}
                    <button
                        onClick={handleLeaveMeeting}
                        className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all ml-4"
                        title="Leave Meeting"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                        </svg>
                    </button>

                    {/* Debug Toggle - Hidden by default unless dev */}
                    <button
                        onClick={() => {
                            const debugPanel = document.getElementById('debug-panel');
                            if (debugPanel) debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
                        }}
                        className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white ml-2"
                        title="Toggle Debug Info"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Debug Panel */}
            <div id="debug-panel" className="fixed bottom-20 right-4 w-[500px] h-[300px] bg-black/90 text-green-400 p-4 rounded border border-green-500 font-mono text-xs overflow-auto z-50">
                <h3 className="border-b border-green-500 mb-2 font-bold flex justify-between">
                    <span>WebRTC Debug Info</span>
                    <button onClick={() => document.getElementById('debug-panel')!.style.display = 'none'} className="text-red-500 hover:text-red-400">Close</button>
                </h3>

                <div className="space-y-4">
                    <div>
                        <div className="font-bold text-white mb-1">Local Stream:</div>
                        {localStream ? (
                            <div>
                                <span className="text-blue-300">ID: {localStream.id}</span>
                                {localStream.getTracks().map(t => (
                                    <div key={t.id} className="pl-2">
                                        - {t.kind}: enabled={String(t.enabled)}, state={t.readyState}, muted={String(t.muted)}
                                    </div>
                                ))}
                            </div>
                        ) : <span className="text-red-400">No local stream</span>}
                    </div>

                    <div>
                        <div className="font-bold text-white mb-1">Remote Streams ({remoteStreams.size}):</div>
                        {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
                            const participant = apiParticipants.find(p => p.user_id === userId);
                            const status = participantStatus.get(userId);
                            return (
                                <div key={userId} className="mb-2 border-l-2 border-blue-500 pl-2">
                                    <div className="text-blue-300 font-bold">{participant?.username || userId}</div>
                                    <div>Stream ID: {stream.id}</div>
                                    <div>Tracks: {stream.getTracks().length}</div>
                                    {stream.getTracks().map(t => (
                                        <div key={t.id} className="pl-2">
                                            - {t.kind}: enabled=<span className={t.enabled ? 'text-green-400' : 'text-red-400'}>{String(t.enabled)}</span>,
                                            state=<span className={t.readyState === 'live' ? 'text-green-400' : 'text-red-400'}>{t.readyState}</span>,
                                            muted=<span className={t.muted ? 'text-red-400' : 'text-green-400'}>{String(t.muted)}</span>
                                        </div>
                                    ))}
                                    <div className="text-yellow-400">
                                        Socket Status: Mic={String(status?.mic)}, Camera={String(status?.camera)}
                                    </div>
                                </div>
                            );
                        })}
                        {remoteStreams.size === 0 && <span className="text-gray-500">No remote streams</span>}
                    </div>

                    <div>
                        <div className="font-bold text-white mb-1">Peer Connections ({peerConnections.size}):</div>
                        {Array.from(peerConnections.entries()).map(([sessionId, data]) => {
                            return (
                                <div key={sessionId} className="mb-1">
                                    <span className="text-orange-300">{sessionId.substring(0, 8)}...</span>:
                                    State={data.peerConnection.connectionState},
                                    ICE={data.peerConnection.iceConnectionState}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
