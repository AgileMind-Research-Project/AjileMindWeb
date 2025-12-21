/**
 * Meeting Store - Zustand State Management
 * 
 * Manages meeting state including active meeting, participants, and media streams
 */

import { create } from 'zustand';

export interface Meeting {
    id: string;
    title: string;
    description?: string;
    channel_id?: string;
    created_by: string;
    status: 'scheduled' | 'active' | 'ended' | 'cancelled';
    scheduled_start?: string;
    scheduled_end?: string;
    actual_start?: string;
    actual_end?: string;
    max_participants: number;
    recording_enabled: boolean;
    recording_url?: string;
    created_at: string;
    updated_at: string;
    participant_count?: number;
    current_participants?: Participant[];
}

export interface Participant {
    id: string;
    user_id: string;
    role: 'host' | 'co-host' | 'participant';
    joined_at?: string;
    left_at?: string;
    duration_seconds: number;
    audio_enabled: boolean;
    video_enabled: boolean;
    screen_shared: boolean;
    user_email?: string;
    user_full_name?: string;
}

interface MeetingState {
    // Current meeting
    activeMeeting: Meeting | null;
    participants: Participant[];

    // Media streams
    localStream: MediaStream | null;
    remoteStreams: Record<string, MediaStream>; // user_id -> stream
    screenShareStream: MediaStream | null;

    // Media state
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;

    // UI state
    isJoining: boolean;
    isInMeeting: boolean;
    error: string | null;

    // Actions
    setActiveMeeting: (meeting: Meeting | null) => void;
    setParticipants: (participants: Participant[]) => void;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (userId: string) => void;
    updateParticipant: (userId: string, updates: Partial<Participant>) => void;

    setLocalStream: (stream: MediaStream | null) => void;
    addRemoteStream: (userId: string, stream: MediaStream) => void;
    removeRemoteStream: (userId: string) => void;
    setScreenShareStream: (stream: MediaStream | null) => void;

    toggleAudio: () => void;
    toggleVideo: () => void;
    toggleScreenShare: () => Promise<void>;

    setAudioEnabled: (enabled: boolean) => void;
    setVideoEnabled: (enabled: boolean) => void;
    setScreenSharing: (sharing: boolean) => void;

    setJoining: (joining: boolean) => void;
    setInMeeting: (inMeeting: boolean) => void;
    setError: (error: string | null) => void;

    leaveMeeting: () => void;
    reset: () => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
    activeMeeting: null,
    participants: [],
    localStream: null,
    remoteStreams: {},
    screenShareStream: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isJoining: false,
    isInMeeting: false,
    error: null,

    setActiveMeeting: (meeting) => set({ activeMeeting: meeting }),

    setParticipants: (participants) => set({ participants }),

    addParticipant: (participant) =>
        set((state) => ({
            participants: [...state.participants, participant],
        })),

    removeParticipant: (userId) =>
        set((state) => ({
            participants: state.participants.filter((p) => p.user_id !== userId),
        })),

    updateParticipant: (userId, updates) =>
        set((state) => ({
            participants: state.participants.map((p) =>
                p.user_id === userId ? { ...p, ...updates } : p
            ),
        })),

    setLocalStream: (stream) => set({ localStream: stream }),

    addRemoteStream: (userId, stream) =>
        set((state) => ({
            remoteStreams: {
                ...state.remoteStreams,
                [userId]: stream,
            },
        })),

    removeRemoteStream: (userId) =>
        set((state) => {
            const newStreams = { ...state.remoteStreams };

            // Stop and remove stream
            const stream = newStreams[userId];
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                delete newStreams[userId];
            }

            return { remoteStreams: newStreams };
        }),

    setScreenShareStream: (stream) => set({ screenShareStream: stream }),

    toggleAudio: () => {
        const state = get();
        const newState = !state.isAudioEnabled;

        if (state.localStream) {
            state.localStream.getAudioTracks().forEach(track => {
                track.enabled = newState;
            });
        }

        set({ isAudioEnabled: newState });
    },

    toggleVideo: () => {
        const state = get();
        const newState = !state.isVideoEnabled;

        if (state.localStream) {
            state.localStream.getVideoTracks().forEach(track => {
                track.enabled = newState;
            });
        }

        set({ isVideoEnabled: newState });
    },

    toggleScreenShare: async () => {
        const state = get();

        if (state.isScreenSharing) {
            // Stop screen sharing
            if (state.screenShareStream) {
                state.screenShareStream.getTracks().forEach(track => track.stop());
                set({ screenShareStream: null, isScreenSharing: false });
            }
        } else {
            // Start screen sharing
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'always',
                    } as any,
                    audio: false,
                });

                set({ screenShareStream: stream, isScreenSharing: true });

                // Auto stop when user stops sharing via browser UI
                stream.getVideoTracks()[0].onended = () => {
                    set({ screenShareStream: null, isScreenSharing: false });
                };
            } catch (error) {
                console.error('Error starting screen share:', error);
                set({ error: 'Failed to start screen sharing' });
            }
        }
    },

    setAudioEnabled: (enabled) => set({ isAudioEnabled: enabled }),
    setVideoEnabled: (enabled) => set({ isVideoEnabled: enabled }),
    setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),

    setJoining: (joining) => set({ isJoining: joining }),
    setInMeeting: (inMeeting) => set({ isInMeeting: inMeeting }),
    setError: (error) => set({ error }),

    leaveMeeting: () => {
        const state = get();

        // Stop all streams
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
        }

        if (state.screenShareStream) {
            state.screenShareStream.getTracks().forEach(track => track.stop());
        }

        Object.values(state.remoteStreams).forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });

        set({
            activeMeeting: null,
            participants: [],
            localStream: null,
            remoteStreams: {},
            screenShareStream: null,
            isAudioEnabled: true,
            isVideoEnabled: true,
            isScreenSharing: false,
            isInMeeting: false,
            error: null,
        });
    },

    reset: () => {
        get().leaveMeeting();
    },
}));
