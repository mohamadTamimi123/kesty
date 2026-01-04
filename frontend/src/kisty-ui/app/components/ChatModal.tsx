"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import {
  XMarkIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ChatBubbleLeftRightIcon,
  WifiIcon,
  SignalSlashIcon,
} from "@heroicons/react/24/outline";
import ConversationList from "./ConversationList";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

export default function ChatModal() {
  const {
    isChatModalOpen,
    isMinimized,
    closeChatModal,
    toggleMinimize,
    activeConversationId,
    setActiveConversation,
    conversations,
    messages,
    sendMessage,
    isLoadingMessages,
    isConnected,
    typingUsers,
    onlineStatus,
  } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showConversationList, setShowConversationList] = useState(true);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const activeMessages = activeConversationId
    ? messages[activeConversationId] || []
    : [];

  const isLoading = activeConversationId
    ? isLoadingMessages[activeConversationId] || false
    : false;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, isMinimized]);

  // Get other user info
  const getOtherUser = () => {
    if (!activeConversation) return null;
    return activeConversation.customerId === user?.id
      ? activeConversation.supplier
      : activeConversation.customer;
  };

  const otherUser = getOtherUser();
  const isOwnMessage = (senderId: string) => senderId === user?.id;
  const isTyping = activeConversationId
    ? typingUsers[activeConversationId]?.has(otherUser?.id || "") || false
    : false;

  if (!isChatModalOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50 animate-fade-in">
        <button
          onClick={toggleMinimize}
          className="bg-brand-medium-blue text-white px-6 py-3 rounded-lg shadow-lg hover:bg-brand-dark-blue transition-colors flex items-center gap-2"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span>چت</span>
          {activeConversation && (
            <span className="bg-white text-brand-medium-blue text-xs font-semibold rounded-full px-2 py-0.5">
              {activeConversation.customerId === user?.id
                ? activeConversation.customerUnreadCount
                : activeConversation.supplierUnreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={closeChatModal}
      />

      {/* Modal */}
      <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 md:h-[600px] h-[calc(100vh-2rem)]
       z-50 bg-white rounded-lg shadow-2xl flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-medium-gray bg-white rounded-t-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {activeConversation && otherUser ? (
              <>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-brand-light-sky flex items-center justify-center overflow-hidden">
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
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-brand-dark-blue truncate">
                    {otherUser.fullName}
                  </h3>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <WifiIcon className="w-3 h-3" />
                        <span className="text-xs">آنلاین</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <SignalSlashIcon className="w-3 h-3" />
                        <span className="text-xs">آفلاین</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-brand-medium-blue" />
                <h3 className="font-semibold text-brand-dark-blue">پیام‌ها</h3>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle conversation list on mobile */}
            {conversations.length > 0 && (
              <button
                onClick={() => setShowConversationList(!showConversationList)}
                className="p-2 hover:bg-brand-light-gray rounded-lg transition-colors md:hidden"
                title="لیست مکالمات"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-brand-medium-blue" />
              </button>
            )}

            <button
              onClick={toggleMinimize}
              className="p-2 hover:bg-brand-light-gray rounded-lg transition-colors"
              title="کوچک کردن"
            >
              <MinusIcon className="w-5 h-5 text-brand-medium-blue" />
            </button>
            <button
              onClick={closeChatModal}
              className="p-2 hover:bg-brand-light-gray rounded-lg transition-colors"
              title="بستن"
            >
              <XMarkIcon className="w-5 h-5 text-brand-medium-blue" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List - Desktop: always visible, Mobile: conditional */}
          {showConversationList && conversations.length > 0 && (
            <div className="hidden md:block w-80 border-l border-brand-medium-gray">
              <ConversationList
                onSelectConversation={(id) => {
                  setActiveConversation(id);
                  setShowConversationList(false);
                }}
                selectedConversationId={activeConversationId}
              />
            </div>
          )}

          {/* Mobile Conversation List Overlay */}
          {showConversationList && conversations.length > 0 && (
            <div className="md:hidden absolute inset-0 bg-white z-10 rounded-lg">
              <div className="p-4 border-b border-brand-medium-gray flex items-center justify-between">
                <h3 className="font-semibold text-brand-dark-blue">مکالمات</h3>
                <button
                  onClick={() => setShowConversationList(false)}
                  className="p-2 hover:bg-brand-light-gray rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-brand-medium-blue" />
                </button>
              </div>
              <ConversationList
                onSelectConversation={(id) => {
                  setActiveConversation(id);
                  setShowConversationList(false);
                }}
                selectedConversationId={activeConversationId}
              />
            </div>
          )}

          {/* Messages Area */}
          {!showConversationList && (
            <div className="flex-1 flex flex-col">
              {!activeConversationId ? (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={
                      <ChatBubbleLeftRightIcon className="w-16 h-16 text-brand-medium-gray mx-auto" />
                    }
                    title="مکالمه‌ای انتخاب نشده"
                    description="یک مکالمه را از لیست انتخاب کنید یا مکالمه جدیدی شروع کنید"
                  />
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 bg-brand-off-white"
                  >
                    {activeMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <EmptyState
                          title="هنوز پیامی ارسال نشده"
                          description="اولین پیام را ارسال کنید"
                        />
                      </div>
                    ) : (
                      <div>
                        {activeMessages.map((message, index) => {
                          const prevMessage = index > 0 ? activeMessages[index - 1] : null;
                          const showAvatar =
                            !prevMessage ||
                            prevMessage.senderId !== message.senderId ||
                            new Date(message.createdAt).getTime() -
                              new Date(prevMessage.createdAt).getTime() >
                              300000; // 5 minutes

                          return (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isOwnMessage={isOwnMessage(message.senderId)}
                              showAvatar={showAvatar}
                              avatarUrl={message.sender.avatarUrl}
                              senderName={message.sender.fullName}
                            />
                          );
                        })}
                        {isTyping && (
                          <div className="flex gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-brand-light-sky flex items-center justify-center flex-shrink-0">
                              {otherUser?.avatarUrl ? (
                                <img
                                  src={otherUser.avatarUrl}
                                  alt={otherUser.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-brand-medium-blue">
                                  {(otherUser?.fullName || "U").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="bg-white border border-brand-medium-gray rounded-lg rounded-tl-none px-4 py-2">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-brand-medium-gray rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-brand-medium-gray rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-brand-medium-gray rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <ChatInput
                    conversationId={activeConversationId}
                    onSend={(content: string) => {
                      if (activeConversationId) {
                        return sendMessage(activeConversationId, content);
                      }
                      return Promise.resolve();
                    }}
                    disabled={!isConnected}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
