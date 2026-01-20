/**
 * WebRTC Peer Connection Utilities
 * 
 * Handles creation and management of RTCPeerConnection instances
 * for peer-to-peer video/audio streaming
 */

// ICE servers for NAT traversal
// STUN helps discover public IP, TURN relays traffic when direct connection fails
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        // Google STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Additional public STUN servers
        { urls: 'stun:stun.stunprotocol.org:3478' },
        // Free public TURN servers (for testing - use your own for production)
        // Metered TURN servers
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        // Twilio's free TURN for testing (may have limits)
        {
            urls: 'turn:global.turn.twilio.com:3478?transport=udp',
            username: '08d5c0e0c5e4e5e0f5c5e0d5c0e5f5e5',
            credential: 'test',
        },
    ],
    // Enable ICE trickling for faster connection
    iceCandidatePoolSize: 10,
    // Allow both direct (peer-to-peer) and relayed (TURN) connections
    iceTransportPolicy: 'all',
};

export interface PeerConnectionCallbacks {
    onTrack: (stream: MediaStream) => void;
    onIceCandidate: (candidate: RTCIceCandidate) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
}

/**
 * Create a new RTCPeerConnection with event handlers
 */
export function createPeerConnection(
    callbacks: PeerConnectionCallbacks
): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Handle incoming media tracks
    pc.ontrack = (event) => {
        console.log('📥 Received remote track:', event.track.kind, 'enabled:', event.track.enabled);
        console.log('📥 Track readyState:', event.track.readyState);
        const stream = event.streams[0];
        if (stream) {
            console.log('📥 Stream has', stream.getVideoTracks().length, 'video tracks,', stream.getAudioTracks().length, 'audio tracks');
            
            // Log when video track becomes active/inactive
            stream.getVideoTracks().forEach(track => {
                track.onended = () => console.log('🔴 Video track ended');
                track.onmute = () => console.log('🔇 Video track muted');
                track.onunmute = () => console.log('🔊 Video track unmuted');
            });
            
            // Log when audio track becomes active/inactive
            stream.getAudioTracks().forEach(track => {
                console.log(`🎤 Audio track: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
                track.onended = () => console.log('🔴 Audio track ended');
                track.onmute = () => console.log('🔇 Audio track muted');
                track.onunmute = () => console.log('🔊 Audio track unmuted');
            });
            
            callbacks.onTrack(stream);
        }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('🧊 New ICE candidate');
            callbacks.onIceCandidate(event.candidate);
        }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', pc.connectionState);
        callbacks.onConnectionStateChange?.(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState);
        callbacks.onIceConnectionStateChange?.(pc.iceConnectionState);
    };

    return pc;
}

/**
 * Add local media stream to peer connection
 */
export function addLocalStream(
    pc: RTCPeerConnection,
    stream: MediaStream
): void {
    stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log('📤 Added local track:', track.kind);
    });
}

/**
 * Create and send offer
 */
export async function createOffer(
    pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
    const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
    });

    await pc.setLocalDescription(offer);
    console.log('📤 Created offer');

    return offer;
}

/**
 * Handle received offer and create answer
 */
export async function handleOffer(
    pc: RTCPeerConnection,
    offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('📥 Set remote offer');

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log('📤 Created answer');

    return answer;
}

/**
 * Handle received answer
 */
export async function handleAnswer(
    pc: RTCPeerConnection,
    answer: RTCSessionDescriptionInit
): Promise<void> {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('📥 Set remote answer');
}

/**
 * Add ICE candidate
 */
export async function addIceCandidate(
    pc: RTCPeerConnection,
    candidate: RTCIceCandidateInit
): Promise<void> {
    try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('🧊 Added ICE candidate');
    } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
    }
}

/**
 * Close peer connection and cleanup
 */
export function closePeerConnection(pc: RTCPeerConnection): void {
    pc.close();
    console.log('🔌 Peer connection closed');
}

/**
 * Get connection stats for debugging
 */
export async function getConnectionStats(
    pc: RTCPeerConnection
): Promise<RTCStatsReport> {
    return await pc.getStats();
}
