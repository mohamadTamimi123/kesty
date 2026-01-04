import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  }
  
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5001`;
  }
  
  return 'ws://localhost:5001';
};

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // 1 second
const INITIAL_RECONNECT_DELAY = 1000; // 1 second (alias for RECONNECT_DELAY)
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

// Calculate exponential backoff delay with jitter
const calculateDelay = (attempt: number): number => {
  const baseDelay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
  const jitter = Math.random() * baseDelay * 0.2; // Add up to 20% jitter
  return baseDelay + jitter;
};

export function useMessagingSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const connectSocket = useCallback(() => {
    if (isConnectingRef.current) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (!token) {
      setIsConnected(false);
      return;
    }

    // Clean up existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    isConnectingRef.current = true;

    const socket = io(`${getSocketUrl()}/messaging`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      setReconnectAttempts(0);
      isConnectingRef.current = false;
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      isConnectingRef.current = false;
      
      // Only attempt manual reconnection if it's not a client-side disconnect
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = calculateDelay(reconnectAttemptsRef.current - 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(reconnectAttemptsRef.current);
            connectSocket();
          }, delay);
        }
      }
    });

    socket.on('connect_error', (error) => {
      isConnectingRef.current = false;
      console.error('Socket connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      setReconnectAttempts(0);
      isConnectingRef.current = false;
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      reconnectAttemptsRef.current = attemptNumber;
      setReconnectAttempts(attemptNumber);
    });

    socket.on('reconnect_failed', () => {
      setIsConnected(false);
      isConnectingRef.current = false;
    });

      socketRef.current = socket;
  }, []);

  useEffect(() => {
    connectSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [connectSocket]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!socketRef.current?.connected && !isConnectingRef.current) {
        connectSocket();
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [connectSocket]);

  const joinConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('joinConversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leaveConversation', { conversationId });
    }
  };

  const onNewMessage = (callback: (data: { conversationId: string; message: any }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('newMessage', callback);
      return () => {
        socketRef.current?.off('newMessage', callback);
      };
    }
    return () => {};
  };

  const onConversationUpdate = (callback: (conversation: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('conversationUpdate', callback);
      return () => {
        socketRef.current?.off('conversationUpdate', callback);
      };
    }
    return () => {};
  };

  const onUserOnlineStatus = (callback: (data: { userId: string; isOnline: boolean; lastSeenAt?: string | null }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('userOnlineStatus', callback);
      return () => {
        socketRef.current?.off('userOnlineStatus', callback);
      };
    }
    return () => {};
  };

  const onMessageDelivered = (callback: (data: { conversationId: string; messageId: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('messageDelivered', callback);
      return () => {
        socketRef.current?.off('messageDelivered', callback);
      };
    }
    return () => {};
  };

  const onMessageRead = (callback: (data: { conversationId: string; messageId: string; userId: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('messageRead', callback);
      return () => {
        socketRef.current?.off('messageRead', callback);
      };
    }
    return () => {};
  };

  const onTyping = (callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('typing', callback);
      return () => {
        socketRef.current?.off('typing', callback);
      };
    }
    return () => {};
  };

  const emitTyping = (conversationId: string, isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { conversationId, isTyping });
    }
  };

  const emitMarkAsRead = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('markAsRead', { conversationId });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    reconnectAttempts,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onConversationUpdate,
    onUserOnlineStatus,
    onMessageDelivered,
    onMessageRead,
    onTyping,
    emitTyping,
    emitMarkAsRead,
  };
}

