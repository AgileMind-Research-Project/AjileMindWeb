/**
 * Socket.IO Client for WebRTC Signaling
 * 
 * Handles real-time communication for:
 * - WebRTC signaling (offer/answer/ICE)
 * - Chat message synchronization
 * - Participant status updates
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, '') || 'http://localhost:8000';
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

    // Meeting Data & Transcripts
    'meeting-info': (data: any) => void;
    'meeting-info-error': (data: { error: string }) => void;
    'save-transcript-success': (data: { meeting_id: string; saved_at: string }) => void;
    'save-transcript-error': (data: { error: string }) => void;
}

class SocketClient {
    private socket: Socket | null = null;
    private meetingId: string | null = null;

    connect(meetingId: string, userId: string, username: string): Socket {
        if (this.socket?.connected) {
            console.log('⚠️ Socket already connected');
            return this.socket;
        }

        console.log('🔌 Connecting to Socket.IO:', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            path: '/socket.io/',
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.meetingId = meetingId;

        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id);

            // Join meeting room
            this.socket?.emit('join_meeting', {
                meeting_id: meetingId,
                user_id: userId,
                username: username,
            });

            console.log(`📍 Joined meeting room: ${meetingId}`);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
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
