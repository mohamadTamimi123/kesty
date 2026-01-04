"use client";

import { useState, useMemo, useEffect, useRef, memo, useCallback } from "react";
import { Conversation } from "../types/messaging";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "./LoadingSpinner";

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string | null;
}

function ConversationList({
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const { conversations, onlineStatus, isLoadingConversations } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const lastLoggedConversationsRef = useRef<string>('');

  // Log conversations only when they actually change
  useEffect(() => {
    if (!user?.id || conversations.length === 0) return;

    const conversationsKey = conversations.map(c => c.id).sort().join(',');
    if (lastLoggedConversationsRef.current === conversationsKey) return;
    
    lastLoggedConversationsRef.current = conversationsKey;

    console.log('🟡 [ConversationList] Conversations changed:', {
      userId: user.id,
      userRole: user.role,
      totalConversations: conversations.length,
      conversationIds: conversations.map(c => c.id),
    });
  }, [conversations, user?.id]);

  const filteredConversations = useMemo(() => {
    // Safety check: if user is not loaded, return empty array
    if (!user?.id) {
      return [];
    }

    // Deduplicate conversations by ID first
    const seenIds = new Set<string>();
    const uniqueConversations = conversations.filter((conv) => {
      if (seenIds.has(conv.id)) {
        return false;
      }
      seenIds.add(conv.id);
      return true;
    });

    // First filter: only show conversations where current user is involved
    const userConversations = uniqueConversations.filter((conv) => {
      // Ensure both IDs exist and match
      if (!conv.customerId || !conv.supplierId) {
        return false;
      }

      // Check if customer and supplier exist
      if (!conv.customer || !conv.supplier) {
        return false;
      }

      const isInvolved = conv.customerId === user.id || conv.supplierId === user.id;
      
      // Only include conversations that have at least one message
      const hasMessages = conv.lastMessageAt !== null && conv.lastMessageAt !== undefined;
      
      return isInvolved && hasMessages;
    });

    // Second filter: apply search query if provided
    if (!searchQuery.trim()) {
      return userConversations;
    }

    const query = searchQuery.toLowerCase();
    const searchFiltered = userConversations.filter((conv) => {
      const otherUser =
        conv.customerId === user.id ? conv.supplier : conv.customer;
      return otherUser?.fullName?.toLowerCase().includes(query);
    });

    return searchFiltered;
  }, [conversations, searchQuery, user]);

  const formatLastMessageTime = useCallback((dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "همین الان";
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    
    return new Intl.DateTimeFormat("fa-IR", {
      month: "short",
      day: "numeric",
    }).format(date);
  }, []);

  const getUnreadCount = useCallback((conversation: Conversation) => {
    const isCustomer = conversation.customerId === user?.id;
    return isCustomer
      ? conversation.customerUnreadCount
      : conversation.supplierUnreadCount;
  }, [user?.id]);

  const getOtherUser = useCallback((conversation: Conversation) => {
    return conversation.customerId === user?.id
      ? conversation.supplier
      : conversation.customer;
  }, [user?.id]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineStatus[userId]?.isOnline || false;
  }, [onlineStatus]);

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-brand-medium-gray">
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-gray">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="جستجو در مکالمات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-brand-medium-blue mb-2">
              {searchQuery
                ? "مکالمه‌ای یافت نشد"
                : "هنوز مکالمه‌ای وجود ندارد"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-brand-medium-gray">
                وقتی با تولیدکنندگان یا مشتریان ارتباط برقرار کنید، مکالمات شما در اینجا نمایش داده می‌شوند
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-brand-medium-gray">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const unreadCount = getUnreadCount(conversation);
              const isSelected = conversation.id === selectedConversationId;
              const isOnline = isUserOnline(otherUser.id);

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full p-4 text-right hover:bg-brand-off-white transition-colors ${
                    isSelected ? "bg-brand-light-sky" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-brand-light-sky flex items-center justify-center overflow-hidden">
                        {otherUser.avatarUrl ? (
                          <img
                            src={otherUser.avatarUrl}
                            alt={otherUser.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-brand-medium-blue">
                            {otherUser.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Online Status Indicator */}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-brand-dark-blue truncate">
                          {otherUser.fullName}
                        </h3>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-brand-medium-gray flex-shrink-0 mr-2">
                            {formatLastMessageTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-brand-medium-blue truncate">
                          {conversation.lastMessage?.content
                            ? conversation.lastMessage.content.length > 50
                              ? conversation.lastMessage.content.substring(0, 50) + "..."
                              : conversation.lastMessage.content
                            : "هنوز پیامی ارسال نشده"}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-brand-medium-blue text-white text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0 mr-2">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ConversationList);
