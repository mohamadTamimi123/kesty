"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "../../../lib/api";
import { Message, Conversation } from "../../../types/messaging";
import toast from "react-hot-toast";
import { ArrowLeftIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useMessagingSocket } from "../../../hooks/useMessagingSocket";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { joinConversation, leaveConversation, onNewMessage, onConversationUpdate } = useMessagingSocket();

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

    return () => {
      if (unsubscribeNewMessage) unsubscribeNewMessage();
      if (unsubscribeConversationUpdate) unsubscribeConversationUpdate();
    };
  }, [conversationId, onNewMessage, onConversationUpdate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    try {
      const data = await apiClient.getConversation(conversationId);
      setConversation(data);
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      toast.error("خطا در دریافت مکالمه");
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getMessages(conversationId);
      setMessages(data.reverse());
      await apiClient.markConversationAsRead(conversationId);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error("خطا در دریافت پیام‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const message = await apiClient.sendMessage(conversationId, newMessage.trim());
      setMessages([...messages, message]);
      setNewMessage("");
      await fetchConversation();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("خطا در ارسال پیام");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-brand-medium-blue">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-brand-medium-blue">مکالمه یافت نشد</div>
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
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-brand-light-sky rounded-lg"
          >
            <ArrowLeftIcon className="w-6 h-6 text-brand-dark-blue" />
          </button>
          <div className="flex items-center gap-3">
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
            <h2 className="font-semibold text-brand-dark-blue">{otherUser.fullName}</h2>
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
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

