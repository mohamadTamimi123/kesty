"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "../../lib/api";
import { Message, Conversation } from "../../types/messaging";
import toast from "react-hot-toast";
import logger from "../../utils/logger";
import { getErrorMessage } from "../../utils/errorHandler";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ArrowLeftIcon, PaperAirplaneIcon, WifiIcon, SignalSlashIcon } from "@heroicons/react/24/outline";
import { useMessagingSocket } from "../../hooks/useMessagingSocket";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { joinConversation, leaveConversation, onNewMessage, onConversationUpdate, onUserOnlineStatus, isConnected, reconnectAttempts } = useMessagingSocket();

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
      joinConversation(conversationId);
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribeNewMessage = onNewMessage((data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => {
          // Check if message already exists
          if (prev.some((m) => m.id === data.message.id)) {
            return prev;
          }
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    });

    const unsubscribeConversationUpdate = onConversationUpdate((updatedConversation) => {
      if (updatedConversation.id === conversationId) {
        setConversation(updatedConversation);
      }
    });

    const unsubscribeUserOnlineStatus = onUserOnlineStatus((data) => {
      if (conversation && (data.userId === conversation.customerId || data.userId === conversation.supplierId)) {
        setOtherUserOnline(data.isOnline);
      }
    });

    return () => {
      if (unsubscribeNewMessage) unsubscribeNewMessage();
      if (unsubscribeConversationUpdate) unsubscribeConversationUpdate();
      if (unsubscribeUserOnlineStatus) unsubscribeUserOnlineStatus();
    };
  }, [conversationId, conversation, onNewMessage, onConversationUpdate, onUserOnlineStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    try {
      const data = await apiClient.getConversation(conversationId);
      setConversation(data);
    } catch (error: unknown) {
      logger.error("Error fetching conversation", error);
      toast.error("خطا در دریافت مکالمه");
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getMessages(conversationId);
      setMessages(data.reverse());
      await apiClient.markConversationAsRead(conversationId);
    } catch (error: unknown) {
      logger.error("Error fetching messages", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    if (!isConnected) {
      toast.error("اتصال برقرار نیست. لطفاً منتظر بمانید...");
      return;
    }

    try {
      setIsSending(true);
      const message = await apiClient.sendMessage(conversationId, newMessage.trim());
      setMessages([...messages, message]);
      setNewMessage("");
      await fetchConversation();
      scrollToBottom();
    } catch (error: unknown) {
      logger.error("Error sending message", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <EmptyState
          title="مکالمه یافت نشد"
          description="مکالمه مورد نظر شما وجود ندارد یا دسترسی به آن ندارید"
        />
      </div>
    );
  }

  const otherUser =
    conversation.customerId === conversation.customer.id
      ? conversation.supplier
      : conversation.customer;

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col">
      <div className="bg-white border-b border-brand-medium-gray px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-brand-light-sky rounded-lg"
            >
              <ArrowLeftIcon className="w-6 h-6 text-brand-dark-blue" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-brand-light-sky rounded-full flex items-center justify-center">
                  {otherUser.avatarUrl ? (
                    <img
                      src={otherUser.avatarUrl}
                      alt={otherUser.fullName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-brand-medium-blue font-semibold">
                      {otherUser.fullName.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Online Status Indicator */}
                {otherUserOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-brand-dark-blue">{otherUser.fullName}</h2>
                {otherUserOnline && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <WifiIcon className="w-3 h-3" />
                    آنلاین
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-600">
                <WifiIcon className="w-4 h-4" />
                <span className="text-xs">اتصال برقرار</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <SignalSlashIcon className="w-4 h-4" />
                <span className="text-xs">
                  {reconnectAttempts > 0 ? `اتصال مجدد... (${reconnectAttempts})` : 'قطع شده'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.senderId === conversation.customerId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? "bg-brand-medium-blue text-white"
                      : "bg-white border border-brand-medium-gray text-brand-dark-blue"
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-blue-100" : "text-brand-medium-gray"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-brand-medium-gray px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending || !isConnected}
            className="p-3 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={!isConnected ? "اتصال برقرار نیست" : ""}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

