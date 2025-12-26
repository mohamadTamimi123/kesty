"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "../lib/api";
import { Conversation } from "../types/messaging";
import toast from "react-hot-toast";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useMessagingSocket } from "../hooks/useMessagingSocket";

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { onNewMessage, onConversationUpdate } = useMessagingSocket();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const unsubscribeNewMessage = onNewMessage((data) => {
      // Refresh conversations list when a new message arrives
      fetchConversations();
    });

    const unsubscribeConversationUpdate = onConversationUpdate((updatedConversation) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        )
      );
    });

    return () => {
      if (unsubscribeNewMessage) unsubscribeNewMessage();
      if (unsubscribeConversationUpdate) unsubscribeConversationUpdate();
    };
  }, [onNewMessage, onConversationUpdate]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getConversations();
      setConversations(data);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error("خطا در دریافت مکالمات");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-brand-medium-blue">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-brand-dark-blue mb-6 font-display">
          پیام‌های من
        </h1>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg border border-brand-medium-gray p-12 text-center">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-brand-medium-gray mx-auto mb-4" />
            <p className="text-brand-medium-blue">هنوز مکالمه‌ای وجود ندارد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const otherUser =
                conversation.customerId === conversation.customer.id
                  ? conversation.supplier
                  : conversation.customer;
              const unreadCount =
                conversation.customerId === conversation.customer.id
                  ? conversation.customerUnreadCount
                  : conversation.supplierUnreadCount;

              return (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/messaging/${conversation.id}`)}
                  className="bg-white rounded-lg border border-brand-medium-gray p-4 cursor-pointer hover:border-brand-medium-blue transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-light-sky rounded-full flex items-center justify-center">
                        {otherUser.avatarUrl ? (
                          <img
                            src={otherUser.avatarUrl}
                            alt={otherUser.fullName}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <span className="text-brand-medium-blue font-semibold">
                            {otherUser.fullName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-dark-blue">
                          {otherUser.fullName}
                        </h3>
                        {conversation.lastMessageAt && (
                          <p className="text-sm text-brand-medium-gray">
                            {new Date(conversation.lastMessageAt).toLocaleDateString("fa-IR")}
                          </p>
                        )}
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <div className="bg-brand-medium-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

