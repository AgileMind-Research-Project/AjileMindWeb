/**
 * MessageInput Component
 * 
 * Input field for sending messages with file upload support
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
    onSendMessage: (content: string, fileId?: string) => void;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
    onFileUpload?: (file: File) => Promise<string>;
    placeholder?: string;
    disabled?: boolean;
}

export function MessageInput({
    onSendMessage,
    onTypingStart,
    onTypingStop,
    onFileUpload,
    placeholder = 'Type a message...',
    disabled = false,
}: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileId, setUploadedFileId] = useState<string | undefined>();
    const [uploadedFileName, setUploadedFileName] = useState<string | undefined>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);

        // Handle typing indicators
        if (onTypingStart) {
            onTypingStart();
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout for typing stop
        typingTimeoutRef.current = setTimeout(() => {
            if (onTypingStop) {
                onTypingStop();
            }
        }, 2000);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim() && !uploadedFileId) return;

        onSendMessage(message.trim(), uploadedFileId);
        setMessage('');
        setUploadedFileId(undefined);
        setUploadedFileName(undefined);

        if (onTypingStop) {
            onTypingStop();
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onFileUpload) return;

        setIsUploading(true);
        try {
            const fileId = await onFileUpload(file);
            setUploadedFileId(fileId);
            setUploadedFileName(file.name);
        } catch (error) {
            console.error('File upload failed:', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeAttachment = () => {
        setUploadedFileId(undefined);
        setUploadedFileName(undefined);
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            {/* File attachment preview */}
            {uploadedFileName && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-gray-100 rounded">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="text-sm text-gray-700 flex-1">{uploadedFileName}</span>
                    <button
                        onClick={removeAttachment}
                        className="p-1 hover:bg-gray-200 rounded"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                    title="Attach file"
                >
                    {isUploading ? (
                        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    )}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                />

                <textarea
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100 max-h-32"
                    style={{
                        minHeight: '40px',
                        height: 'auto',
                    }}
                    onInput={(e) => {
                        e.currentTarget.style.height = 'auto';
                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                    }}
                />

                <button
                    type="submit"
                    disabled={disabled || (!message.trim() && !uploadedFileId)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>

            <p className="mt-2 text-xs text-gray-500">
                Press Enter to send, Shift + Enter for new line
            </p>
        </div>
    );
}
