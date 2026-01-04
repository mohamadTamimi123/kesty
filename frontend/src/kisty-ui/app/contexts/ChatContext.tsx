"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from "react";
import { Conversation, Message, UserOnlineStatus } from "../types/messaging";
import { Quote } from "../types/quote";
import apiClient from "../lib/api";
import { useAuth } from "./AuthContext";
import { useMessagingSocket } from "../hooks/useMessagingSocket";
import logger from "../utils/logger";
import toast from "react-hot-toast";

export interface ChatContextType {
  // State
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  unreadCount: number;
  onlineStatus: Record<string, UserOnlineStatus>;
  typingUsers: Record<string, Set<string>>;
  isChatSidebarOpen: boolean;
  isCollapsed: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: Record<string, boolean>;
  quoteContext: Quote | null;
  
  // Actions
  openChatSidebar: (conversationId?: string) => void;
  closeChatSidebar: () => void;
  toggleCollapse: () => void;
  setActiveConversation: (conversationId: string | null) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (supplierId: string, projectId?: string) => Promise<Conversation | null>;
  refreshConversations: () => Promise<void>;
  setQuoteContext: (quote: Quote | null) => void;
  sendInitialQuoteMessage: (conversationId: string, quote: Quote) => Promise<void>;
  
  // WebSocket status
  isConnected: boolean;
  
  // Backward compatibility
  isChatModalOpen: boolean;
  isMinimized: boolean;
  openChatModal: (conversationId?: string) => void;
  closeChatModal: () => void;
  toggleMinimize: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onConversationUpdate,
    onMessageDelivered,
    onMessageRead,
    onUserOnlineStatus,
    onTyping,
    emitTyping,
  } = useMessagingSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, UserOnlineStatus>>({});
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});
  const [quoteContext, setQuoteContext] = useState<Quote | null>(null);
  const loadedConversationsRef = useRef<Set<string>>(new Set());
  const lastFetchTimeRef = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations with debouncing to prevent excessive refreshes
  const fetchConversations = useCallback(async (force: boolean = false) => {
    if (!isAuthenticated) return;
    
    // Debounce: cancel previous pending fetch and schedule new one
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    // If force is true, fetch immediately
    if (force) {
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 1000) {
        // Still throttle even for force - don't fetch if last fetch was less than 1 second ago
        return;
      }
      lastFetchTimeRef.current = now;
    } else {
      // Debounce: wait 500ms before fetching
      fetchTimeoutRef.current = setTimeout(async () => {
        const now = Date.now();
        if (now - lastFetchTimeRef.current < 1000) {
          return;
        }
        lastFetchTimeRef.current = now;
        await executeFetch();
      }, 500);
      return;
    }
    
    await executeFetch();
    
    async function executeFetch() {
      try {
      setIsLoadingConversations(true);
      const data = await apiClient.getConversations();
      const conversationsList = Array.isArray(data) ? data : [];
      
      // Additional safety filter: only include conversations where user is involved
      // Also deduplicate by conversation ID
      const seenIds = new Set<string>();
      const filteredConversations = conversationsList.filter((conv) => {
        // Deduplicate: skip if we've seen this conversation ID before
        if (seenIds.has(conv.id)) {
          return false;
        }
        seenIds.add(conv.id);

        // Check basic data
        if (!user?.id || !conv.customerId || !conv.supplierId) {
          return false;
        }

        // Check if customer and supplier exist
        if (!conv.customer || !conv.supplier) {
          return false;
        }

        // Check roles - customer should be CUSTOMER, supplier should be SUPPLIER
        const customerRole = conv.customer.role?.toUpperCase();
        const supplierRole = conv.supplier.role?.toUpperCase();
        
        if (customerRole !== 'CUSTOMER' || supplierRole !== 'SUPPLIER') {
          return false;
        }

        // Check if user is involved
        const isInvolved = conv.customerId === user.id || conv.supplierId === user.id;
        
        // Only include conversations that have at least one message
        const hasMessages = conv.lastMessageAt !== null && conv.lastMessageAt !== undefined;
        
        return isInvolved && hasMessages;
      });

      // Log filtered conversations only once per fetch
      const filteredOut = conversationsList.length - filteredConversations.length;
      if (filteredOut > 0) {
        const invalidConversations = conversationsList.filter((conv) => {
          if (!user?.id || !conv.customerId || !conv.supplierId) return true;
          if (!conv.customer || !conv.supplier) return true;
          const customerRole = conv.customer.role?.toUpperCase();
          const supplierRole = conv.supplier.role?.toUpperCase();
          if (customerRole !== 'CUSTOMER' || supplierRole !== 'SUPPLIER') return true;
          const isInvolved = conv.customerId === user.id || conv.supplierId === user.id;
          return !isInvolved;
        });

        console.log('🔴 [ChatContext] Filtered out conversations:', {
          totalFiltered: filteredOut,
          invalidConversations: invalidConversations.map(conv => ({
            id: conv.id,
            customerId: conv.customerId,
            supplierId: conv.supplierId,
            customerName: conv.customer?.fullName,
            customerRole: conv.customer?.role,
            supplierName: conv.supplier?.fullName,
            supplierRole: conv.supplier?.role,
            reason: !user?.id || !conv.customerId || !conv.supplierId ? 'missing_data' :
                    !conv.customer || !conv.supplier ? 'missing_relations' :
                    conv.customer?.role?.toUpperCase() !== 'CUSTOMER' || conv.supplier?.role?.toUpperCase() !== 'SUPPLIER' ? 'wrong_role' :
                    (conv.customerId !== user?.id && conv.supplierId !== user?.id) ? 'user_not_involved' : 'unknown',
          }))
        });
      }
      
      console.log('🟢 [ChatContext] Valid Conversations:', {
        userId: user?.id,
        userRole: user?.role,
        totalFromAPI: conversationsList.length,
        totalFiltered: filteredConversations.length,
        conversations: filteredConversations.map(conv => ({
          id: conv.id,
          customerId: conv.customerId,
          supplierId: conv.supplierId,
          customerName: conv.customer?.fullName,
          supplierName: conv.supplier?.fullName,
          isCurrentUserCustomer: conv.customerId === user?.id,
          isCurrentUserSupplier: conv.supplierId === user?.id,
          unreadCount: conv.customerId === user?.id ? conv.customerUnreadCount : conv.supplierUnreadCount,
        }))
      });
      
      setConversations(filteredConversations);
      
      // Calculate unread count
      const totalUnread = filteredConversations.reduce((sum, conv) => {
        const isCustomer = conv.customerId === user?.id;
        return sum + (isCustomer ? conv.customerUnreadCount : conv.supplierUnreadCount);
      }, 0);
      
      console.log('📊 [ChatContext] Unread Count:', {
        userId: user?.id,
        totalUnread,
        breakdown: filteredConversations.map(conv => ({
          conversationId: conv.id,
          isCustomer: conv.customerId === user?.id,
          unreadCount: conv.customerId === user?.id ? conv.customerUnreadCount : conv.supplierUnreadCount,
        }))
      });
      
      setUnreadCount(totalUnread);
      } catch (error) {
        logger.error("Error fetching conversations", error);
        toast.error("خطا در دریافت مکالمات");
      } finally {
        setIsLoadingConversations(false);
      }
    }
  }, [isAuthenticated, user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, forceReload: boolean = false) => {
    // Check if already loaded - but allow reload if forceReload is true
    if (!forceReload && loadedConversationsRef.current.has(conversationId)) {
      return; // Already loaded
    }
    
    // Check if currently loading
    setIsLoadingMessages((prev) => {
      if (prev[conversationId] && !forceReload) {
        return prev; // Already loading
      }
      return { ...prev, [conversationId]: true };
    });
    
    try {
      const data = await apiClient.getMessages(conversationId);
      setMessages((prev) => {
        const newMessages = Array.isArray(data) ? data.reverse() : [];
        
        // If forceReload, replace all messages
        if (forceReload) {
          return {
            ...prev,
            [conversationId]: newMessages,
          };
        }
        
        // Otherwise, merge with existing messages (keep old messages that might not be in new fetch)
        const existingMessages = prev[conversationId] || [];
        if (existingMessages.length === 0) {
          return {
            ...prev,
            [conversationId]: newMessages,
          };
        }
        
        // Merge: combine existing and new messages, remove duplicates, sort by createdAt
        const allMessages = [...existingMessages, ...newMessages];
        const uniqueMessages = allMessages.filter((msg, index, self) => 
          index === self.findIndex((m) => m.id === msg.id)
        );
        
        // Sort by createdAt (oldest first)
        uniqueMessages.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
        
        return {
          ...prev,
          [conversationId]: uniqueMessages,
        };
      });
      // Mark as loaded using ref
      loadedConversationsRef.current.add(conversationId);
    } catch (error) {
      logger.error("Error fetching messages", error);
      toast.error("خطا در دریافت پیام‌ها");
    } finally {
      setIsLoadingMessages((prev) => ({ ...prev, [conversationId]: false }));
    }
  }, []); // Empty dependency array - no dependencies needed

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiClient.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      logger.error("Error fetching unread count", error);
    }
  }, [isAuthenticated]);

  // Initial load - use refs to prevent unnecessary reloads
  const isAuthenticatedRef = useRef(isAuthenticated);
  const userIdRef = useRef(user?.id);
  
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    userIdRef.current = user?.id;
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticatedRef.current) {
      fetchConversations(true); // Force fetch on initial load
      fetchUnreadCount();
      
      // Update last seen periodically
      const interval = setInterval(() => {
        apiClient.updateLastSeen().catch(() => {});
      }, 30000); // Every 30 seconds
      
      return () => {
        clearInterval(interval);
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    } else {
      // Clear loaded conversations when user logs out
      loadedConversationsRef.current.clear();
      setMessages({});
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    }
    // Only depend on isAuthenticated and user.id, not the callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeNewMessage = onNewMessage((data) => {
      setMessages((prev) => {
        const existingMessages = prev[data.conversationId] || [];
        // Check if message already exists
        if (existingMessages.some((m) => m.id === data.message.id)) {
          return prev;
        }
        
        // Insert message in correct position based on createdAt (oldest first)
        const newMessageDate = new Date(data.message.createdAt).getTime();
        const insertIndex = existingMessages.findIndex((msg) => {
          const msgDate = new Date(msg.createdAt).getTime();
          return msgDate > newMessageDate;
        });
        
        const updatedMessages = insertIndex === -1
          ? [...existingMessages, data.message] // Append if newest
          : [
              ...existingMessages.slice(0, insertIndex),
              data.message,
              ...existingMessages.slice(insertIndex),
            ];
        
        return {
          ...prev,
          [data.conversationId]: updatedMessages,
        };
      });
      
      // Update conversation state directly instead of refetching
      setConversations((prev) => 
        prev.map((conv) => {
          if (conv.id !== data.conversationId) return conv;
          
          // Only increment unread count for the receiver, not the sender
          const isSenderCustomer = data.message.senderId === conv.customerId;
          const isCurrentUserSender = data.message.senderId === user?.id;
          
          return {
            ...conv,
            lastMessageAt: data.message.createdAt,
            lastMessage: data.message,
            // Only increment unread count if current user is not the sender
            customerUnreadCount: isSenderCustomer || isCurrentUserSender
              ? conv.customerUnreadCount
              : conv.customerUnreadCount + 1,
            supplierUnreadCount: !isSenderCustomer || isCurrentUserSender
              ? conv.supplierUnreadCount
              : conv.supplierUnreadCount + 1,
          };
        })
      );
      
      // Only update unread count, don't refetch all conversations
      fetchUnreadCount();
    });

    const unsubscribeConversationUpdate = onConversationUpdate((updatedConversation) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        )
      );
      fetchUnreadCount();
    });

    const unsubscribeMessageDelivered = onMessageDelivered((data) => {
      setMessages((prev) => {
        const convMessages = prev[data.conversationId] || [];
        return {
          ...prev,
          [data.conversationId]: convMessages.map((msg) =>
            msg.id === data.messageId && !msg.deliveredAt
              ? { ...msg, deliveredAt: new Date().toISOString() }
              : msg
          ),
        };
      });
    });

    const unsubscribeMessageRead = onMessageRead((data) => {
      setMessages((prev) => {
        const convMessages = prev[data.conversationId] || [];
        return {
          ...prev,
          [data.conversationId]: convMessages.map((msg) =>
            msg.id === data.messageId && !msg.isRead
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          ),
        };
      });
    });

    const unsubscribeUserOnlineStatus = onUserOnlineStatus((data) => {
      setOnlineStatus((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          isOnline: data.isOnline,
          lastSeenAt: data.lastSeenAt || null,
        },
      }));
    });

    const unsubscribeTyping = onTyping((data) => {
      setTypingUsers((prev) => {
        const current = prev[data.conversationId] || new Set();
        if (data.isTyping) {
          current.add(data.userId);
        } else {
          current.delete(data.userId);
        }
        return {
          ...prev,
          [data.conversationId]: current,
        };
      });
    });

    return () => {
      if (unsubscribeNewMessage) unsubscribeNewMessage();
      if (unsubscribeConversationUpdate) unsubscribeConversationUpdate();
      if (unsubscribeMessageDelivered) unsubscribeMessageDelivered();
      if (unsubscribeMessageRead) unsubscribeMessageRead();
      if (unsubscribeUserOnlineStatus) unsubscribeUserOnlineStatus();
      if (unsubscribeTyping) unsubscribeTyping();
    };
  }, [
    isConnected,
    onNewMessage,
    onConversationUpdate,
    onMessageDelivered,
    onMessageRead,
    onUserOnlineStatus,
    onTyping,
    fetchUnreadCount,
    user?.id,
  ]);

  // Define markAsRead before it's used in useEffect
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id) return;
    
    try {
      await apiClient.markConversationAsRead(conversationId);
      
      // Update state directly instead of refetching to avoid refresh
      setConversations((prev) => {
        let unreadCountToSubtract = 0;
        const updated = prev.map((conv) => {
          if (conv.id !== conversationId) return conv;
          const isCustomer = conv.customerId === user.id;
          unreadCountToSubtract = isCustomer
            ? conv.customerUnreadCount
            : conv.supplierUnreadCount;
          return {
            ...conv,
            customerUnreadCount: isCustomer ? 0 : conv.customerUnreadCount,
            supplierUnreadCount: !isCustomer ? 0 : conv.supplierUnreadCount,
          };
        });
        
        // Update unread count
        if (unreadCountToSubtract > 0) {
          setUnreadCount((current) => Math.max(0, current - unreadCountToSubtract));
        }
        
        return updated;
      });
    } catch (error) {
      logger.error("Error marking as read", error);
    }
  }, [user?.id]);

  // Join/leave conversation when active changes
  useEffect(() => {
    if (!activeConversationId) return;
    
    const conversationId = activeConversationId;
    
    // Always fetch messages, even if WebSocket is not connected
    fetchMessages(conversationId);
    
    // Join conversation room if WebSocket is connected
    if (isConnected) {
      joinConversation(conversationId);
      
      // Mark as read after a short delay to ensure messages are loaded
      const markAsReadTimeout = setTimeout(() => {
        markAsRead(conversationId);
      }, 500);
      
      return () => {
        leaveConversation(conversationId);
        clearTimeout(markAsReadTimeout);
      };
    }
    
    // If not connected, still mark as read after delay
    const markAsReadTimeout = setTimeout(() => {
      markAsRead(conversationId);
    }, 500);
    
    return () => {
      clearTimeout(markAsReadTimeout);
    };
  }, [activeConversationId, isConnected, joinConversation, leaveConversation, fetchMessages, markAsRead]);

  // Actions - Define setActiveConversation first since it's used by openChatModal
  const setActiveConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    // fetchMessages and markAsRead will be handled by the useEffect that watches activeConversationId
  }, []);

  const openChatSidebar = useCallback((conversationId?: string) => {
    setIsChatSidebarOpen(true);
    setIsCollapsed(false);
    if (conversationId) {
      setActiveConversation(conversationId);
    }
  }, [setActiveConversation]);

  const closeChatSidebar = useCallback(() => {
    setIsChatSidebarOpen(false);
    setActiveConversationId(null);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Backward compatibility aliases
  const openChatModal = useCallback((conversationId?: string) => {
    openChatSidebar(conversationId);
  }, [openChatSidebar]);

  const closeChatModal = useCallback(() => {
    closeChatSidebar();
  }, [closeChatSidebar]);

  const toggleMinimize = useCallback(() => {
    toggleCollapse();
  }, [toggleCollapse]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!content.trim()) return;
    
    try {
      const message = await apiClient.sendMessage(conversationId, content.trim());
      setMessages((prev) => {
        const existingMessages = prev[conversationId] || [];
        // Check if message already exists
        if (existingMessages.some((m) => m.id === message.id)) {
          return prev;
        }
        return {
          ...prev,
          [conversationId]: [...existingMessages, message],
        };
      });
      
      // Update conversation in state without full refresh
      // Note: Unread count should be updated by the backend, but we update UI optimistically
      setConversations((prev) => 
        prev.map((conv) => 
          conv.id === conversationId
            ? {
                ...conv,
                lastMessageAt: new Date().toISOString(),
                lastMessage: message,
                // Don't increment unread count for sender - backend handles this correctly
                // Just keep the current values, backend will update via WebSocket
              }
            : conv
        )
      );
      
      // Update unread count optimistically - WebSocket will update it correctly
      // No need to refetch conversations as state is already updated
    } catch (error) {
      logger.error("Error sending message", error);
      toast.error("خطا در ارسال پیام");
      throw error;
    }
  }, [user?.id]);

  const createConversation = useCallback(async (otherUserId: string, projectId?: string): Promise<Conversation | null> => {
    try {
      const conversation = await apiClient.createConversation(otherUserId, projectId);
      // Add conversation to state immediately without full refresh
      setConversations((prev) => {
        // Deduplicate: check if conversation already exists by ID
        const existingIndex = prev.findIndex((c) => c.id === conversation.id);
        if (existingIndex >= 0) {
          // Update existing conversation instead of adding duplicate
          const updated = [...prev];
          updated[existingIndex] = conversation;
          return updated;
        }
        
        // Also check for duplicate by customer/supplier pair (shouldn't happen but just in case)
        const duplicateIndex = prev.findIndex((c) => 
          (c.customerId === conversation.customerId && c.supplierId === conversation.supplierId) ||
          (c.customerId === conversation.supplierId && c.supplierId === conversation.customerId)
        );
        if (duplicateIndex >= 0) {
          // Replace duplicate with new conversation
          const updated = [...prev];
          updated[duplicateIndex] = conversation;
          return updated;
        }
        
        // Add new conversation at the beginning
        return [conversation, ...prev];
      });
      // Refresh conversations to ensure consistency
      setTimeout(() => {
        fetchConversations(true);
      }, 500);
      return conversation;
    } catch (error) {
      logger.error("Error creating conversation", error);
      toast.error("خطا در ایجاد مکالمه");
      return null;
    }
  }, [fetchConversations]);

  const refreshConversations = useCallback(async () => {
    await fetchConversations(true); // Force refresh
    await fetchUnreadCount();
  }, [fetchConversations, fetchUnreadCount]);

  const sendInitialQuoteMessage = useCallback(async (conversationId: string, quote: Quote) => {
    if (!quote.description || quote.description.trim() === '') {
      return; // No description to send
    }

    try {
      // Fetch fresh messages from API instead of using stale closure
      const freshMessages = await apiClient.getMessages(conversationId);
      const existingMessages = Array.isArray(freshMessages) ? freshMessages : [];
      
      const hasInitialMessage = existingMessages.some(
        (msg) => msg.content.includes(quote.description || '') || 
                 msg.content.includes('پیشنهاد') ||
                 msg.content.includes('قیمت')
      );

      if (hasInitialMessage) {
        return; // Already sent
      }

      // Format the initial message with quote details
      const projectTitle = quote.project?.title || 'پروژه';
      const priceFormatted = new Intl.NumberFormat('fa-IR').format(quote.price);
      const deliveryText = quote.deliveryTimeDays ? '\nزمان تحویل: ' + quote.deliveryTimeDays + ' روز' : '';
      const descriptionText = quote.description || '';
      const initialMessage = 'پیشنهاد من برای پروژه "' + projectTitle + '":\n\n' +
        'قیمت: ' + priceFormatted + ' تومان' + deliveryText + '\n\n' +
        descriptionText;

      await sendMessage(conversationId, initialMessage);
      
      // Refresh conversations after a short delay to ensure the message is saved and conversation is updated
      setTimeout(() => {
        fetchConversations(true);
      }, 500);
    } catch (error) {
      logger.error("Error sending initial quote message", error);
      // Don't show error toast, just log it
    }
  }, [sendMessage, fetchConversations]);

  const value: ChatContextType = useMemo(() => ({
    conversations,
    activeConversationId,
    messages,
    unreadCount,
    onlineStatus,
    typingUsers,
    isChatSidebarOpen,
    isCollapsed,
    isLoadingConversations,
    isLoadingMessages,
    quoteContext,
    openChatSidebar,
    closeChatSidebar,
    toggleCollapse,
    setActiveConversation,
    sendMessage,
    markAsRead,
    createConversation,
    refreshConversations,
    setQuoteContext,
    sendInitialQuoteMessage,
    isConnected,
    // Backward compatibility
    isChatModalOpen: isChatSidebarOpen,
    isMinimized: isCollapsed,
    openChatModal,
    closeChatModal,
    toggleMinimize,
  }), [
    conversations,
    activeConversationId,
    messages,
    unreadCount,
    onlineStatus,
    typingUsers,
    isChatSidebarOpen,
    isCollapsed,
    isLoadingConversations,
    isLoadingMessages,
    quoteContext,
    openChatSidebar,
    closeChatSidebar,
    toggleCollapse,
    setActiveConversation,
    sendMessage,
    markAsRead,
    createConversation,
    refreshConversations,
    setQuoteContext,
    sendInitialQuoteMessage,
    isConnected,
    openChatModal,
    closeChatModal,
    toggleMinimize,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
