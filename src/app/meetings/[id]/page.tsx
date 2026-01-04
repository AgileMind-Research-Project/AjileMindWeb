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
import { useParams, useSearchParams } from 'next/navigation';
import { useMeetingStore } from '@/lib/store/meetingStore';

export default function MeetingRoomPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const meetingId = params.id as string;
    const channelId = searchParams.get('channel');
    const channelTitle = searchParams.get('title');

    const [isInitializing, setIsInitializing] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

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

    // Initialize meeting on mount
    useEffect(() => {
        initializeMeeting();

        return () => {
            // Cleanup on unmount
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Update video element when local stream changes
    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream]);

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

            // In a real implementation, you would:
            // 1. Connect to WebRTC signaling server
            // 2. Join the meeting room
            // 3. Set up peer connections
            // 4. Handle incoming streams from other participants

        } catch (error) {
            console.error('Failed to access media devices:', error);
            alert('Failed to access camera/microphone. Please check permissions.');
        } finally {
            setIsInitializing(false);
        }
    };

    const handleLeaveMeeting = () => {
        if (confirm('Are you sure you want to leave this meeting?')) {
            leaveMeeting();
            window.close(); // Close the meeting tab
        }
    };

    const handleToggleAudio = () => {
        toggleAudio();
    };

    const handleToggleVideo = () => {
        toggleVideo();
    };

    const handleToggleScreenShare = async () => {
        await toggleScreenShare();
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
                    {/* Participant Count */}
                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {participants.length + 1}
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
                <div className="flex-1 p-4 flex items-center justify-center">
                    <div className="relative w-full h-full max-w-6xl">
                        {/* Local Video */}
                        <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden">
                            {localStream && isVideoEnabled ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover mirror"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                    <div className="text-center">
                                        <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <p className="text-2xl font-semibold text-white">You</p>
                                        {!isVideoEnabled && (
                                            <p className="text-sm text-white/80 mt-2">Camera is off</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Audio Indicator */}
                            {!isAudioEnabled && (
                                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                    Muted
                                </div>
                            )}

                            {/* Name Tag */}
                            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                                You
                            </div>
                        </div>

                        {/* Other Participants (Placeholder) */}
                        {participants.length === 0 && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <p className="text-gray-400 text-lg">Waiting for others to join...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Sidebar */}
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-white">Meeting Chat</h3>
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            <p className="text-gray-500 text-sm text-center">No messages yet</p>
                        </div>
                        <div className="p-4 border-t border-gray-700">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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
                </div>
            </div>
        </div>
    );
}
