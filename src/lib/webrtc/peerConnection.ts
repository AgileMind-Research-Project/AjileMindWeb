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

        // Other Reliable Public STUN
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.framasoft.org:3478' },
        { urls: 'stun:stun.voipbuster.com:3478' },
        { urls: 'stun:stun.voipstunt.com:3478' },
        // Port 443 STUN often bypasses firewalls
        { urls: 'stun:stun.nextcloud.com:443' },
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
    onIceGatheringStateChange?: (state: RTCIceGatheringState) => void;
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

    pc.onicegatheringstatechange = () => {
        console.log('🧊 ICE gathering state:', pc.iceGatheringState);
        callbacks.onIceGatheringStateChange?.(pc.iceGatheringState);
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
    if (pc.signalingState === 'have-local-offer') {
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('📥 Set remote answer');
        } catch (e) {
            console.error('❌ Failed to set remote answer:', e);
        }
    } else {
        console.warn(`⚠️ Cannot set remote answer in state: ${pc.signalingState}`);
    }
}

/**
 * Add ICE candidate
 */
export async function addIceCandidate(
    pc: RTCPeerConnection,
    candidate: RTCIceCandidateInit
): Promise<void> {
    try {
        if (pc.remoteDescription && pc.signalingState !== 'closed') {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('🧊 Added ICE candidate');
        }
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
