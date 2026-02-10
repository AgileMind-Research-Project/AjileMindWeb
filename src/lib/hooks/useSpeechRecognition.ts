import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHookProps {
    onResult: (text: string, isFinal: boolean) => void;
    isListening: boolean;
    language?: string;
    minConfidence?: number; // 0.0 to 1.0
}

export function useSpeechRecognition({
    onResult,
    isListening,
    language = 'en-US',
    minConfidence = 0.75
}: SpeechRecognitionHookProps) {
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null); // Use any for SpeechRecognition as it might not be in all TS types

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech Recognition API not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptObj = event.results[i][0];
                const transcriptText = transcriptObj.transcript;
                const confidence = transcriptObj.confidence || 0;

                // Log confidence for debugging/tuning
                // console.debug(`Speech detected: "${transcriptText}" (Confidence: ${confidence.toFixed(2)})`);

                if (event.results[i].isFinal) {
                    if (confidence >= minConfidence) {
                        finalTranscript += transcriptText;
                    } else {
                        console.warn(`⚠️ Low confidence speech ignored: "${transcriptText}" (${confidence.toFixed(2)} < ${minConfidence})`);
                    }
                } else {
                    interimTranscript += transcriptText;
                }
            }

            if (finalTranscript) {
                onResult(finalTranscript.trim(), true);
            }

            // Optional: Handle interim results if needed for UI feedback
            // onResult(interimTranscript, false);
        };

        recognition.onerror = (event: any) => {
            // Ignore no-speech error (common silence error)
            if (event.error === 'no-speech') {
                return;
            }

            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                setError('Microphone permission denied for speech recognition.');
            }
        };

        recognition.onend = () => {
            // Auto-restart if it stops but should be listening
            if (isListening && recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // Ignore error if already started
                }
            }
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [language]);

    // Toggle listening
    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                // Already started
            }
        } else {
            recognition.stop();
        }
    }, [isListening]);

    return { error };
}
