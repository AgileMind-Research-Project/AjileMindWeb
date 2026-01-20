/**
 * WebRTC Peer Connection Utilities
 * 
 * Handles creation and management of RTCPeerConnection instances
 * for peer-to-peer video/audio streaming
 */

// STUN servers for N AT traversal
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
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
        console.log('📥 Received remote track:', event.track.kind);
        const stream = event.streams[0];
        if (stream) {
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
