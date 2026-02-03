/**
 * Socket.IO Client for Real-Time Features
 * Handles WebRTC signaling, chat, and presence
 */

import { io, Socket } from 'socket.io-client';

// Dynamic Socket.IO URL - uses current hostname
const getSocketURL = () => {
    // Priority 1: Explicit WebSocket URL from environment
    if (process.env.NEXT_PUBLIC_WS_URL) {
        return process.env.NEXT_PUBLIC_WS_URL;
    }

    // Priority 2: Infer from API Base URL
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
        try {
            const url = new URL(process.env.NEXT_PUBLIC_API_BASE_URL);
            // Always return the origin (protocol + host + port), stripping any path like /api/v1
            // socket.io-client handles http->ws upgrade automatically
            return url.origin;
        } catch (e) {
            console.warn('⚠️ Invalid NEXT_PUBLIC_API_BASE_URL, falling back to window location');
        }
    }

    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return 'http://localhost:8000';
};

const SOCKET_URL = getSocketURL();
const SOCKET_PATH = '/socket.io/';

export interface SocketEvents {
    // Connection
    connect: () => void;
    disconnect: () => void;

    // Meeting
    'user-joined': (data: { user_id: string; username: string; session_id: string }) => void;
    'user-left': (data: { user_id: string; username: string }) => void;
    'existing-participants': (data: { participants: Array<{ user_id: string; username: string; session_id: string }> }) => void;

    // WebRTC Signaling
    offer: (data: { from: string; user_id: string; username: string; offer: RTCSessionDescriptionInit }) => void;
    answer: (data: { from: string; answer: RTCSessionDescriptionInit }) => void;
    'ice-candidate': (data: { from: string; candidate: RTCIceCandidateInit }) => void;

    // Chat
    'chat-message': (data: { user_id: string; username: string; message: string; timestamp: string }) => void;

    // Status
    'mic-toggle': (data: { user_id: string; enabled: boolean }) => void;
    'camera-toggle': (data: { user_id: string; enabled: boolean }) => void;
    'screen-share-toggle': (data: { user_id: string; enabled: boolean }) => void;
    'user-speaking': (data: { user_id: string; username: string; speaking: boolean }) => void;

    // Meeting Data & Transcripts
    'meeting-info': (data: any) => void;
    'meeting-info-error': (data: { error: string }) => void;
    'save-transcript-success': (data: { meeting_id: string; saved_at: string }) => void;
    'save-transcript-error': (data: { error: string }) => void;
}

class SocketClient {
    private socket: Socket | null = null;
    private meetingId: string | null = null;

    connect(meetingId: string, userId: string, username: string, role?: string, email?: string): Socket {
        if (this.socket?.connected) {
            console.log('⚠️ Socket already connected');
            return this.socket;
        }

        console.log('🔌 Connecting to Socket.IO:', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
            reconnection: true,
            reconnectionAttempts: 50,
            reconnectionDelay: 1000,
            timeout: 20000,
            auth: {
                token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
            }
        });

        this.meetingId = meetingId;

        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id);
            console.log('🔌 Socket transport:', this.socket?.io.engine.transport.name);

            // Join meeting room
            this.socket?.emit('join_meeting', {
                meeting_id: meetingId,
                user_id: userId,
                username: username,
                role: role || 'Participant',
                email: email || '',
            });

            console.log(`📍 Joining meeting room: ${meetingId} as ${username} (${userId})`);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
        });

        // Debug: Log ALL incoming events
        this.socket.onAny((eventName, ...args) => {
            console.log(`📨 Socket event received: ${eventName}`, args);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting socket');
            this.socket.disconnect();
            this.socket = null;
            this.meetingId = null;
        }
    }

    // WebRTC Signaling
    sendOffer(to: string, offer: RTCSessionDescriptionInit) {
        this.socket?.emit('offer', { to, offer });
        console.log('📤 Sent offer to:', to);
    }

    sendAnswer(to: string, answer: RTCSessionDescriptionInit) {
        this.socket?.emit('answer', { to, answer });
        console.log('📤 Sent answer to:', to);
    }

    sendIceCandidate(to: string, candidate: RTCIceCandidateInit) {
        this.socket?.emit('ice_candidate', { to, candidate });
        console.log('🧊 Sent ICE candidate to:', to);
    }

    // Chat
    sendChatMessage(message: string, timestamp: string) {
        this.socket?.emit('chat_message', { message, timestamp });
        console.log('💬 Sent chat message:', message.substring(0, 50));
    }

    // Status Updates
    sendMicToggle(enabled: boolean) {
        this.socket?.emit('mic_toggle', { enabled });
        console.log('🎤 Mic toggle:', enabled);
    }

    sendCameraToggle(enabled: boolean) {
        this.socket?.emit('camera_toggle', { enabled });
        console.log('📹 Camera toggle:', enabled);
    }

    sendScreenShareToggle(enabled: boolean) {
        this.socket?.emit('screen_share_toggle', { enabled });
        console.log('🖥️ Screen share toggle:', enabled);
    }

    // Speaking status - broadcast when user is speaking
    sendSpeakingStatus(speaking: boolean) {
        this.socket?.emit('speaking', { speaking });
        // Only log when starting to speak (reduces console noise)
        if (speaking) {
            console.log('🗣️ Speaking status:', speaking);
        }
    }

    sendTranscriptSegment(text: string, isFinal: boolean) {
        if (this.socket) {
            this.socket.emit('transcript_segment', {
                text,
                is_final: isFinal,
                timestamp: new Date().toISOString()
            });
            console.log('📝 Sent transcript segment:', isFinal ? '(Final)' : '(Interim)', text.substring(0, 30));
        }
    }

    // Meeting Data & Transcripts
    getMeetingInfo(meetingId: string) {
        this.socket?.emit('get_meeting_info', { meeting_id: meetingId });
        console.log('📊 Requested meeting info for:', meetingId);
    }

    saveTranscript(meetingId?: string) {
        this.socket?.emit('save_transcript', { meeting_id: meetingId });
        console.log('📝 Requested transcript save for:', meetingId || 'current meeting');
    }

    // Event listeners
    on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
        this.socket?.on(event, handler as any);
    }

    off<K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]) {
        this.socket?.off(event, handler as any);
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Singleton instance
const socketClient = new SocketClient();

export default socketClient;
