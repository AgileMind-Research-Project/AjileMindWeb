/**
 * WebSocket Context Provider
 * 
 * Centralized WebSocket management for the application with:
 * - Automatic reconnection
 * - JWT authentication
 * - Event subscription system
 * - Connection state management
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

interface WebSocketContextType {
    isConnected: boolean;
    sendMessage: (message: WebSocketMessage) => void;
    subscribe: (type: string, handler: (payload: any) => void) => () => void;
    connect: (url: string, token: string) => void;
    disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
}

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const subscriptionsRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000; // Start with 1 second

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);
            const handlers = subscriptionsRef.current.get(message.type);

            if (handlers) {
                handlers.forEach(handler => {
                    try {
                        handler(message);
                    } catch (error) {
                        console.error('Error in message handler:', error);
                    }
                });
            }

            // Also trigger wildcard handlers
            const wildcardHandlers = subscriptionsRef.current.get('*');
            if (wildcardHandlers) {
                wildcardHandlers.forEach(handler => {
                    try {
                        handler(message);
                    } catch (error) {
                        console.error('Error in wildcard handler:', error);
                    }
                });
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }, []);

    const connect = useCallback((url: string, token: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected:', url);
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = handleMessage;

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Attempt reconnection with exponential backoff
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
                    reconnectAttemptsRef.current++;

                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect(url, token);
                    }, delay);
                } else {
                    console.error('Max reconnection attempts reached');
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Error creating WebSocket:', error);
        }
    }, [handleMessage]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        reconnectAttemptsRef.current = 0;
    }, []);

    const sendMessage = useCallback((message: WebSocketMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, message not sent:', message);
        }
    }, []);

    const subscribe = useCallback((type: string, handler: (payload: any) => void) => {
        if (!subscriptionsRef.current.has(type)) {
            subscriptionsRef.current.set(type, new Set());
        }
        subscriptionsRef.current.get(type)!.add(handler);

        // Return unsubscribe function
        return () => {
            const handlers = subscriptionsRef.current.get(type);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    subscriptionsRef.current.delete(type);
                }
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    const value: WebSocketContextType = {
        isConnected,
        sendMessage,
        subscribe,
        connect,
        disconnect,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

/**
 * Hook for specific WebSocket connection
 */
export function useWebSocketConnection(url: string, enabled: boolean = true) {
    const { connect, disconnect, isConnected } = useWebSocket();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Get token from storage or auth context
        const storedToken = localStorage.getItem('access_token');
        setToken(storedToken);
    }, []);

    useEffect(() => {
        if (enabled && token && url) {
            connect(url, token);
            return () => disconnect();
        }
    }, [url, token, enabled, connect, disconnect]);

    return { isConnected };
}
