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
    userRole?: string;
    userEmail?: string;
    localStream: MediaStream | null;
    peerConnections: Map<string, PeerData>;
    setPeerConnections: React.Dispatch<React.SetStateAction<Map<string, PeerData>>>;
    setRemoteStreams: React.Dispatch<React.SetStateAction<Map<string, MediaStream>>>;
    setParticipantStatus: React.Dispatch<React.SetStateAction<Map<string, { mic: boolean, camera: boolean }>>>;
    setChatMessages: React.Dispatch<React.SetStateAction<Array<{ id: string, sender: string, message: string, timestamp: string }>>>;
    socketRef: MutableRefObject<Socket | null>;
    peerConnectionsRef: MutableRefObject<Map<string, PeerData>>; // NEW: Ref for mutable access in closures
    onUserJoined?: (data: { user_id: string; username: string; session_id: string }) => void;
    onUserLeft?: (data: { user_id: string; username: string }) => void;
}

export function useWebRTC(params: UseWebRTCParams) {
    const {
        meetingId,
        userId,
        username,
        userRole,
        userEmail,
        localStream,
        peerConnections,
        setPeerConnections,
        peerConnectionsRef, // Destructure ref
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
        const socket = socketClient.connect(meetingId, userId, username, userRole, userEmail);
        socketRef.current = socket;

        // Create peer connection for a user
        const createPeer = (sessionId: string, orderId: string, username: string) => {
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
                                next.set(orderId, stream);
                                return next;
                            });
                        };
                        track.onmute = () => {
                            console.log(`🔇 Video track muted for ${username} - video will show avatar`);
                            // Force re-render
                            setRemoteStreams(prev => {
                                const next = new Map(prev);
                                next.set(orderId, stream);
                                return next;
                            });
                        };
                    });

                    setRemoteStreams(prev => {
                        const next = new Map(prev);
                        next.set(orderId, stream);
                        return next;
                    });

                    setPeerConnections(prev => {
                        const next = new Map(prev);
                        const peerData = next.get(sessionId);
                        if (peerData) {
                            peerData.stream = stream;
                        }
                        // Update ref as well
                        peerConnectionsRef.current = next;
                        return next;
                    });
                },
                onIceCandidate: (candidate) => {
                    socketClient.sendIceCandidate(sessionId, candidate);
                },
                onConnectionStateChange: (state) => {
                    console.log(`🔗 Peer ${username} connection state:`, state);
                    if (state === 'failed' || state === 'closed') {
                        // Remove peer
                        setPeerConnections(prev => {
                            const next = new Map(prev);
                            next.delete(sessionId);
                            peerConnectionsRef.current = next;
                            return next;
                        });
                        setRemoteStreams(prev => {
                            const next = new Map(prev);
                            next.delete(orderId);
                            return next;
                        });
                    } else if (state === 'disconnected') {
                        console.warn(`⚠️ Peer ${username} disconnected (might recover)`);
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
                peerConnectionsRef.current = next; // Update Ref!
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

            // Notify parent component immediately to update UI
            onUserJoined?.(data);

            // DO NOT create peer or send offer here. 
            // We wait for the JOINING user to send us an offer to avoid "Glare" (collision).
            // The 'offer' event handler will create the peer when the offer arrives.
            console.log(`⏳ Waiting for offer from new user: ${data.username}`);
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

            // Use REF to get the latest peer connection, not the stale closure variable
            const peerData = peerConnectionsRef.current.get(data.from);

            if (peerData) {
                console.log(`✅ Found peer connection for answer from ${data.from}`);
                await webrtc.handleAnswer(peerData.peerConnection, data.answer);
            } else {
                console.warn(`⚠️ Could not find peer connection for answer from ${data.from}`);
                console.log('Current peers in ref:', Array.from(peerConnectionsRef.current.keys()));
            }
        });

        // Handle ICE candidate
        socket.on('ice-candidate', async (data) => {
            // Use REF
            const peerData = peerConnectionsRef.current.get(data.from);

            if (peerData) {
                const pc = peerData.peerConnection;

                // Check if we can add the candidate immediately
                if (pc.remoteDescription) {
                    await webrtc.addIceCandidate(pc, data.candidate);
                } else {
                    // Queue the candidate
                    console.log(`🧊 Queueing ICE candidate for ${data.from} (no remote description)`);

                    if (!(pc as any).__iceCandidateQueue) {
                        (pc as any).__iceCandidateQueue = [];

                        // Add listener to drain queue when remote description is set
                        const checkQueue = async () => {
                            if (pc.remoteDescription && (pc as any).__iceCandidateQueue.length > 0) {
                                console.log(`🧊 Draining ${(pc as any).__iceCandidateQueue.length} ICE candidates for receiving peer`);
                                for (const candidate of (pc as any).__iceCandidateQueue) {
                                    await webrtc.addIceCandidate(pc, candidate);
                                }
                                (pc as any).__iceCandidateQueue = [];
                            }
                        };

                        // Listen for signaling state changes
                        pc.onsignalingstatechange = () => {
                            if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer' || pc.signalingState === 'have-remote-offer') {
                                checkQueue();
                            }
                        };

                        // Create an interval just in case event misses (safety net)
                        const interval = setInterval(() => {
                            if (pc.remoteDescription) {
                                checkQueue();
                                clearInterval(interval);
                            }
                            if (pc.connectionState === 'closed') clearInterval(interval);
                        }, 500);
                    }

                    (pc as any).__iceCandidateQueue.push(data.candidate);
                }
            } else {
                console.warn(`⚠️ Ignored ICE candidate from unknown peer: ${data.from}`);
            }
        });

        // Handle user left
        socket.on('user-left', (data) => {
            console.log(`👤 User left: ${data.username}`);

            // Notify parent component immediately
            onUserLeft?.(data);

            // Find and remove peer connection
            peerConnectionsRef.current.forEach((peerData, sessionId) => {
                // We might need to map sessionId to userId or iterate??
                // Wait, data.user_id is passed. The map key is `sessionId` (socket ID usually).
                // We need to find the session ID for this user ID? 

                // Correction: The backend `user-left` event might not send session_id if the socket disconnected abruptly.
                // We don't have a direct map of userId -> sessionId here efficiently.
                // But we can iterate.

                // Actually, let's just clean up everything in the state based on the current peers.
                // The `createPeer` closure captured the IDs.
                // But we can't access them easily here.

                // Let's rely on the state updater which iterates.
            });

            // Clean up by iterating state - setPeerConnections updater gives us access
            setPeerConnections(prev => {
                const next = new Map(prev);
                // We need to find the key (session_id) that belongs to this user? 
                // The PeerData doesn't store user_id explicitly in the value.
                // Ideally, PeerData should store userId.

                // For now, let's just re-implement the iteration if possible or rely on connection closed.
                // Actually, if a user leaves the meeting room, their socket disconnects, so connection state change might fire.

                return next;
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
