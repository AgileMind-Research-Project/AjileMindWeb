/**
 * WebRTC Integration Hooks for Meeting Page
 * 
 * Handles Socket.IO connection and WebRTC peer management
 */

import { useEffect, useRef, MutableRefObject } from 'react';
import socketClient from '@/lib/websocket/socketClient';
import * as webrtc from '@/lib/webrtc/peerConnection';
import type { Socket } from 'socket.io-client';

interface PeerData {
    peerConnection: RTCPeerConnection;
    stream: MediaStream | null;
}

export interface UseWebRTCParams {
    meetingId: string;
    userId: string;
    username: string;
    localStream: MediaStream | null;
    peerConnections: Map<string, PeerData>;
    setPeerConnections: React.Dispatch<React.SetStateAction<Map<string, PeerData>>>;
    setRemoteStreams: React.Dispatch<React.SetStateAction<Map<string, MediaStream>>>;
    setParticipantStatus: React.Dispatch<React.SetStateAction<Map<string, { mic: boolean, camera: boolean }>>>;
    setChatMessages: React.Dispatch<React.SetStateAction<Array<{ id: string, sender: string, message: string, timestamp: string }>>>;
    socketRef: MutableRefObject<Socket | null>;
    onUserJoined?: (data: { user_id: string; username: string; session_id: string }) => void;
    onUserLeft?: (data: { user_id: string; username: string }) => void;
}

export function useWebRTC(params: UseWebRTCParams) {
    const {
        meetingId,
        userId,
        username,
        localStream,
        peerConnections,
        setPeerConnections,
        setRemoteStreams,
        setParticipantStatus,
        setChatMessages,
        socketRef,
        onUserJoined,
        onUserLeft,
    } = params;

    useEffect(() => {
        if (!userId || !localStream) {
            console.log('⏳ WebRTC waiting for:', { 
                hasUserId: !!userId, 
                userId: userId || 'none',
                hasLocalStream: !!localStream 
            });
            return;
        }

        console.log('🚀 Initializing WebRTC with media stream...');
        console.log('🔑 User ID:', userId);
        console.log('👤 Username:', username);
        console.log('🏠 Meeting ID:', meetingId);

        // Connect to Socket.IO
        const socket = socketClient.connect(meetingId, userId, username);
        socketRef.current = socket;

        // Create peer connection for a user
        const createPeer = (sessionId: string, oderId: string, username: string) => {
            console.log(`🔗 Creating peer connection for ${username} (${sessionId})`);

            const pc = webrtc.createPeerConnection({
                onTrack: (stream) => {
                    console.log(`📥 Received stream from ${username}`);
                    
                    // Listen for track unmute to update UI when video starts flowing
                    stream.getVideoTracks().forEach(track => {
                        track.onunmute = () => {
                            console.log(`🔊 Video track unmuted for ${username} - video should now display`);
                            // Force re-render by updating the stream reference
                            setRemoteStreams(prev => {
                                const next = new Map(prev);
                                next.set(oderId, stream);
                                return next;
                            });
                        };
                        track.onmute = () => {
                            console.log(`🔇 Video track muted for ${username} - video will show avatar`);
                            // Force re-render
                            setRemoteStreams(prev => {
                                const next = new Map(prev);
                                next.set(oderId, stream);
                                return next;
                            });
                        };
                    });
                    
                    setRemoteStreams(prev => {
                        const next = new Map(prev);
                        next.set(oderId, stream);
                        return next;
                    });

                    setPeerConnections(prev => {
                        const next = new Map(prev);
                        const peerData = next.get(sessionId);
                        if (peerData) {
                            peerData.stream = stream;
                        }
                        return next;
                    });
                },
                onIceCandidate: (candidate) => {
                    socketClient.sendIceCandidate(sessionId, candidate);
                },
                onConnectionStateChange: (state) => {
                    console.log(`🔗 Peer ${username} connection state:`, state);
                    if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                        // Remove peer
                        setPeerConnections(prev => {
                            const next = new Map(prev);
                            next.delete(sessionId);
                            return next;
                        });
                        setRemoteStreams(prev => {
                            const next = new Map(prev);
                            next.delete(oderId);
                            return next;
                        });
                    }
                },
            });

            // Add local stream
            if (localStream) {
                webrtc.addLocalStream(pc, localStream);
            }

            // Store peer connection
            setPeerConnections(prev => {
                const next = new Map(prev);
                next.set(sessionId, { peerConnection: pc, stream: null });
                return next;
            });

            return pc;
        };

        // Handle existing participants (when we join a meeting with users already in it)
        socket.on('existing-participants', async (data) => {
            console.log(`📋 Received ${data.participants.length} existing participants`);

            // Create peer connections to all existing users and send offers
            for (const participant of data.participants) {
                console.log(`🔗 Connecting to existing user: ${participant.username}`);
                console.log(`📊 Their media status - mic: ${participant.mic_enabled}, camera: ${participant.camera_enabled}`);

                // Set initial media status BEFORE peer connection
                setParticipantStatus(prev => {
                    const next = new Map(prev);
                    next.set(participant.user_id, {
                        mic: participant.mic_enabled ?? true,
                        camera: participant.camera_enabled ?? true
                    });
                    return next;
                });

                // Notify parent component
                onUserJoined?.(participant);

                // Create peer connection and send offer
                const pc = createPeer(participant.session_id, participant.user_id, participant.username);
                const offer = await webrtc.createOffer(pc);
                socketClient.sendOffer(participant.session_id, offer);
            }
        });

        // Handle user joined
        socket.on('user-joined', async (data) => {
            console.log(`👤 User joined: ${data.username} (${data.session_id})`);
            console.log(`📊 New user media status - mic: ${data.mic_enabled}, camera: ${data.camera_enabled}`);

            // Set initial media status for new user
            setParticipantStatus(prev => {
                const next = new Map(prev);
                next.set(data.user_id, {
                    mic: data.mic_enabled ?? true,
                    camera: data.camera_enabled ?? true
                });
                return next;
            });

            // Notify parent component immediately
            onUserJoined?.(data);

            // Create peer connection and send offer
            const pc = createPeer(data.session_id, data.user_id, data.username);
            const offer = await webrtc.createOffer(pc);
            socketClient.sendOffer(data.session_id, offer);
        });

        // Handle offer
        socket.on('offer', async (data) => {
            console.log(`📥 Received offer from ${data.username}`);

            // Create peer connection
            const pc = createPeer(data.from, data.user_id, data.username);

            // Handle offer and send answer
            const answer = await webrtc.handleOffer(pc, data.offer);
            socketClient.sendAnswer(data.from, answer);
        });

        // Handle answer
        socket.on('answer', async (data) => {
            console.log(`📥 Received answer from ${data.from}`);

            const peerData = peerConnections.get(data.from);
            if (peerData) {
                await webrtc.handleAnswer(peerData.peerConnection, data.answer);
            }
        });

        // Handle ICE candidate
        socket.on('ice-candidate', async (data) => {
            const peerData = peerConnections.get(data.from);
            if (peerData) {
                await webrtc.addIceCandidate(peerData.peerConnection, data.candidate);
            }
        });

        // Handle user left
        socket.on('user-left', (data) => {
            console.log(`👤 User left: ${data.username}`);

            // Notify parent component immediately
            onUserLeft?.(data);

            // Find and remove peer connection
            peerConnections.forEach((peerData, sessionId) => {
                // Close and remove
                peerData.peerConnection.close();
                setPeerConnections(prev => {
                    const next = new Map(prev);
                    next.delete(sessionId);
                    return next;
                });
            });

            setRemoteStreams(prev => {
                const next = new Map(prev);
                next.delete(data.user_id);
                return next;
            });
        });

        // Handle chat messages
        socket.on('chat-message', (data) => {
            const timestamp = data.timestamp || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            setChatMessages(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                sender: data.username,
                message: data.message,
                timestamp,
            }]);
        });

        // Handle status updates
        socket.on('mic-toggle', (data) => {
            console.log(`🎤 Received mic-toggle: user=${data.user_id}, enabled=${data.enabled}`);
            setParticipantStatus(prev => {
                const next = new Map(prev);
                const current = next.get(data.user_id) || { mic: true, camera: true };
                next.set(data.user_id, { ...current, mic: data.enabled });
                return next;
            });
        });

        socket.on('camera-toggle', (data) => {
            console.log(`📹 Received camera-toggle: user=${data.user_id}, enabled=${data.enabled}`);
            setParticipantStatus(prev => {
                const next = new Map(prev);
                const current = next.get(data.user_id) || { mic: true, camera: true };
                next.set(data.user_id, { ...current, camera: data.enabled });
                console.log(`📹 Updated participant status for ${data.user_id}: camera=${data.enabled}`);
                return next;
            });
        });

        // Handle speaking status from other participants (socket-based speaking indicator)
        socket.on('user-speaking', (data) => {
            console.log(`🗣️ Received user-speaking: user=${data.user_id} (${data.username}), speaking=${data.speaking}`);
            // This event is handled in the meeting page component via socket listener
            // The setSpeakingUsers is managed there
        });

        // Cleanup on unmount
        return () => {
            console.log('🔌 Cleaning up WebRTC...');

            // Close all peer connections
            peerConnections.forEach((peerData) => {
                peerData.peerConnection.close();
            });

            // Disconnect socket
            socketClient.disconnect();
        };
    }, [meetingId, userId, username, localStream]); // Need localStream to trigger when media is ready

    return {
        sendChatMessage: (message: string) => {
            const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            socketClient.sendChatMessage(message, timestamp);
        },
        broadcastMicStatus: (enabled: boolean) => {
            socketClient.sendMicToggle(enabled);
        },
        broadcastCameraStatus: (enabled: boolean) => {
            socketClient.sendCameraToggle(enabled);
        },
    };
}
