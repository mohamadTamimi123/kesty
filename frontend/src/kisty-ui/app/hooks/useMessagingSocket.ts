import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  }
  
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001`;
  }
  
  return 'ws://localhost:3001';
};

export function useMessagingSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (!token) {
      return;
    }

    const socket = io(`${getSocketUrl()}/messaging`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('joinConversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current) {
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
  };

  const onConversationUpdate = (callback: (conversation: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('conversationUpdate', callback);
      return () => {
        socketRef.current?.off('conversationUpdate', callback);
      };
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onConversationUpdate,
  };
}

