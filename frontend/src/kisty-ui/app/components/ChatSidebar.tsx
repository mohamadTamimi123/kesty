"use client";

import { useEffect, useRef, useState, useMemo, memo, useCallback } from "react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChatBubbleLeftRightIcon,
  WifiIcon,
  SignalSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { QuoteStatus } from "../types/quote";
import Link from "next/link";
import Button from "./Button";
import ConversationList from "./ConversationList";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
import ConfirmationDialog from "./ConfirmationDialog";
import apiClient from "../lib/api";
import toast from "react-hot-toast";
import logger from "../utils/logger";

function ChatSidebar() {
  const {
    isChatSidebarOpen,
    isCollapsed,
    closeChatSidebar,
    toggleCollapse,
    openChatSidebar,
    activeConversationId,
    setActiveConversation,
    conversations,
    messages,
    sendMessage,
    isLoadingMessages,
    isConnected,
    typingUsers,
    onlineStatus,
    unreadCount,
    quoteContext,
    setQuoteContext,
  } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Show conversation list by default on mobile, hide on desktop (desktop shows both side by side)
  const [showConversationList, setShowConversationList] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'messages' | 'tickets'>('messages');
  const [showAcceptQuoteDialog, setShowAcceptQuoteDialog] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const activeMessages = useMemo(
    () => (activeConversationId ? messages[activeConversationId] || [] : []),
    [activeConversationId, messages]
  );

  const isLoading = useMemo(
    () => (activeConversationId ? isLoadingMessages[activeConversationId] || false : false),
    [activeConversationId, isLoadingMessages]
  );

  // Get other user info
  const getOtherUser = () => {
    if (!activeConversation) return null;
    return activeConversation.customerId === user?.id
      ? activeConversation.supplier
      : activeConversation.customer;
  };

  const otherUser = useMemo(() => getOtherUser(), [activeConversation, user?.id]);
  const isOwnMessage = (senderId: string) => senderId === user?.id;
  const isTyping = useMemo(
    () =>
      activeConversationId
        ? typingUsers[activeConversationId]?.has(otherUser?.id || "") || false
        : false,
    [activeConversationId, typingUsers, otherUser?.id]
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isCollapsed && isChatSidebarOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, isCollapsed, isChatSidebarOpen]);

  // Collapsed state - always visible in desktop, floating button in mobile
  if (!isChatSidebarOpen) {
    return (
      <>
        {/* Floating button for mobile */}
        <button
          onClick={() => openChatSidebar()}
          className="fixed bottom-6 left-6 z-40 bg-brand-medium-blue text-white p-4 rounded-full shadow-lg hover:bg-brand-dark-blue transition-all hover:scale-110 flex items-center gap-2 lg:hidden animate-fade-in"
          title="باز کردن چت"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Collapsed sidebar for desktop */}
        <div className="hidden lg:flex fixed top-0 left-0 h-full w-16 bg-white border-l border-brand-medium-gray z-[55] flex-col items-center py-4 shadow-lg">
          <button
            onClick={() => openChatSidebar()}
            className="p-3 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue transition-colors mb-4 relative"
            title="باز کردن چت"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </>
    );
  }

  if (isCollapsed) {
    return (
      <>
        {/* Collapsed sidebar for desktop */}
        <div className="hidden lg:flex fixed top-0 left-0 h-full w-16 bg-white border-l border-brand-medium-gray z-[55] flex-col items-center py-4 shadow-lg">
          <button
            onClick={toggleCollapse}
            className="p-3 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue transition-colors mb-4 relative"
            title="باز کردن چت"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-[59] lg:hidden animate-fade-in"
        onClick={closeChatSidebar}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-full md:w-[500px] lg:w-[700px] xl:w-[800px] bg-white border-l border-brand-medium-gray z-[60]
          flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isChatSidebarOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex flex-col border-b border-brand-medium-gray bg-white flex-shrink-0">
          {/* Tabs */}
          <div className="flex gap-2 px-4 pt-4 border-b border-brand-medium-gray">
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'messages'
                  ? 'text-brand-medium-blue border-b-2 border-brand-medium-blue'
                  : 'text-brand-medium-gray hover:text-brand-dark-blue'
              }`}
            >
              پیام‌ها
              {activeTab === 'messages' && unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'tickets'
                  ? 'text-brand-medium-blue border-b-2 border-brand-medium-blue'
                  : 'text-brand-medium-gray hover:text-brand-dark-blue'
              }`}
            >
              تیکت
            </button>
          </div>

          {/* Header Content */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Back button to conversation list - show when viewing a conversation */}
              {activeConversation && !showConversationList && activeTab === 'messages' && (
                <button
                  onClick={() => setShowConversationList(true)}
                  className="p-2 hover:bg-brand-off-white rounded-lg transition-colors flex-shrink-0"
                  title="بازگشت به لیست مکالمات"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-brand-medium-blue" />
                </button>
              )}
              {activeConversation && otherUser && activeTab === 'messages' ? (
              <>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-brand-light-sky flex items-center justify-center overflow-hidden">
                    {otherUser.avatarUrl && !avatarErrors.has(otherUser.avatarUrl) ? (
                      <img
                        src={otherUser.avatarUrl}
                        alt={otherUser.fullName}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setAvatarErrors((prev) => new Set(prev).add(otherUser.avatarUrl || ''));
                        }}
                      />
                    ) : (
                      <span className="text-sm font-semibold text-brand-medium-blue">
                        {otherUser.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Online Status Indicator */}
                  {onlineStatus[otherUser.id]?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-brand-dark-blue truncate font-display">
                      {quoteContext ? "مکالمه درباره پیشنهاد" : otherUser.fullName}
                    </h3>
                    {quoteContext && quoteContext.supplier && (
                      <Link
                        href={`/public/supplier/${(quoteContext.supplier as any).slug || quoteContext.supplier.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
                        title="مشاهده پروفایل"
                      >
                        <UserCircleIcon className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && onlineStatus[otherUser.id]?.isOnline ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <WifiIcon className="w-3 h-3" />
                        <span className="text-xs">آنلاین</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-brand-medium-gray">
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
                <h3 className="font-semibold text-brand-dark-blue font-display">
                  {activeTab === 'messages' ? 'پیام‌ها' : 'تیکت'}
                </h3>
              </div>
            )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle conversation list on mobile */}
            {conversations.length > 0 && (
              <button
                onClick={() => setShowConversationList(!showConversationList)}
                className="p-2 hover:bg-brand-off-white rounded-lg transition-colors lg:hidden"
                title="لیست مکالمات"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-brand-medium-blue" />
              </button>
            )}

            <button
              onClick={toggleCollapse}
              className="p-2 hover:bg-brand-off-white rounded-lg transition-colors hidden lg:flex"
              title="کوچک کردن"
            >
              <ChevronLeftIcon className="w-5 h-5 text-brand-medium-blue" />
            </button>
            <button
              onClick={closeChatSidebar}
              className="p-2 hover:bg-brand-off-white rounded-lg transition-colors"
              title="بستن"
            >
              <XMarkIcon className="w-5 h-5 text-brand-medium-blue" />
            </button>
          </div>
        </div>

        {/* Quote Summary Section - Only show for messages tab */}
        {activeTab === 'messages' && quoteContext && activeConversationId && (
          <div className="border-b border-brand-medium-gray bg-brand-light-sky p-4 flex-shrink-0">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-brand-dark-blue mb-2 font-display">
                خلاصه پیشنهاد
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-brand-medium-blue">قیمت:</span>
                  <span className="font-semibold text-brand-dark-blue flex items-center gap-1">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    {new Intl.NumberFormat('fa-IR').format(quoteContext.price)} تومان
                  </span>
                </div>
                {quoteContext.deliveryTimeDays && (
                  <div className="flex items-center justify-between">
                    <span className="text-brand-medium-blue">زمان تحویل:</span>
                    <span className="font-semibold text-brand-dark-blue flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {quoteContext.deliveryTimeDays} روز
                    </span>
                  </div>
                )}
                {quoteContext.supplier?.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-brand-medium-blue">رتبه:</span>
                    <span className="font-semibold text-brand-dark-blue flex items-center gap-1">
                      <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                      {quoteContext.supplier.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-brand-medium-blue">وضعیت:</span>
                  {quoteContext.status === QuoteStatus.ACCEPTED ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300 flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3" />
                      پذیرفته شده
                    </span>
                  ) : quoteContext.status === QuoteStatus.REJECTED ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-300 flex items-center gap-1">
                      <XCircleIcon className="w-3 h-3" />
                      رد شده
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      در انتظار
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quote Actions - Only show for PENDING quotes */}
            {quoteContext.status === QuoteStatus.PENDING && user?.role === 'customer' && (
              <div className="flex gap-2 pt-3 border-t border-brand-medium-gray">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowAcceptQuoteDialog(true);
                  }}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  پذیرش پیشنهاد
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    try {
                      await apiClient.rejectQuote(quoteContext.id);
                      toast.success("پیشنهاد رد شد");
                      setQuoteContext(null);
                      window.location.reload();
                    } catch (error) {
                      logger.error("Error rejecting quote", error);
                      toast.error("خطا در رد پیشنهاد");
                    }
                  }}
                >
                  <XCircleIcon className="w-4 h-4" />
                  رد
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'messages' ? (
            <>
              {/* Conversation List - Desktop: always visible, Mobile: conditional */}
              {conversations.length > 0 && (
                <>
                  {/* Desktop: Always show conversation list */}
                  <div className="hidden lg:block w-[320px] xl:w-[350px] border-l border-brand-medium-gray flex-shrink-0">
                    <ConversationList
                      onSelectConversation={(id) => {
                        setActiveConversation(id);
                        // On mobile, hide list when selecting conversation
                        if (window.innerWidth < 1024) {
                          setShowConversationList(false);
                        }
                      }}
                      selectedConversationId={activeConversationId}
                    />
                  </div>

                  {/* Mobile Conversation List Overlay */}
                  {showConversationList && (
                    <div className="lg:hidden absolute inset-0 bg-white z-10">
                      <div className="p-4 border-b border-brand-medium-gray flex items-center justify-between">
                        <h3 className="font-semibold text-brand-dark-blue font-display">مکالمات</h3>
                        <button
                          onClick={() => setShowConversationList(false)}
                          className="p-2 hover:bg-brand-off-white rounded-lg transition-colors"
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
                </>
              )}

              {/* Messages Area - Desktop: always show, Mobile: show when conversation list is hidden or no conversations */}
              <div className={`flex-1 flex flex-col min-w-0 ${(showConversationList && conversations.length > 0) ? 'hidden lg:flex' : 'flex'}`}>
              {!activeConversationId ? (
                <div className="flex-1 flex items-center justify-center bg-brand-off-white">
                  <EmptyState
                    icon={
                      <ChatBubbleLeftRightIcon className="w-16 h-16 text-brand-medium-gray mx-auto" />
                    }
                    title="مکالمه‌ای انتخاب نشده"
                    description="یک مکالمه را از لیست انتخاب کنید یا مکالمه جدیدی شروع کنید"
                  />
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex items-center justify-center bg-brand-off-white">
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
                              conversationProjectId={activeConversation?.projectId}
                            />
                          );
                        })}
                        {isTyping && (
                          <div className="flex gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-brand-light-sky flex items-center justify-center flex-shrink-0">
                              {otherUser?.avatarUrl && !avatarErrors.has(otherUser.avatarUrl) ? (
                                <img
                                  src={otherUser.avatarUrl}
                                  alt={otherUser.fullName}
                                  className="w-full h-full object-cover"
                                  onError={() => {
                                    if (otherUser?.avatarUrl) {
                                      setAvatarErrors((prev) => new Set(prev).add(otherUser.avatarUrl!));
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-semibold text-brand-medium-blue">
                                  {(otherUser?.fullName || "U").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="bg-white border border-brand-medium-gray rounded-lg rounded-tl-none px-4 py-2">
                              <div className="flex gap-1">
                                <span
                                  className="w-2 h-2 bg-brand-medium-gray rounded-full animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                ></span>
                                <span
                                  className="w-2 h-2 bg-brand-medium-gray rounded-full animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                ></span>
                                <span
                                  className="w-2 h-2 bg-brand-medium-gray rounded-full animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                ></span>
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
            </>
          ) : (
            /* Tickets Tab Content */
            <div className="flex-1 flex items-center justify-center bg-brand-off-white">
              <EmptyState
                icon={
                  <DocumentTextIcon className="w-16 h-16 text-brand-medium-gray mx-auto" />
                }
                title="سیستم تیکت"
                description="سیستم تیکت به زودی اضافه می‌شود"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Accept Quote Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showAcceptQuoteDialog}
        title="پذیرش پیشنهاد"
        message="آیا مطمئن هستید که می‌خواهید این پیشنهاد را بپذیرید؟ با پذیرش این پیشنهاد، سایر پیشنهادات رد می‌شوند."
        confirmText="پذیرش پیشنهاد"
        cancelText="انصراف"
        variant="warning"
        onConfirm={async () => {
          try {
            if (!quoteContext?.id) return;
            await apiClient.acceptQuote(quoteContext.id);
            toast.success("پیشنهاد با موفقیت پذیرفته شد");
            setQuoteContext(null);
            setShowAcceptQuoteDialog(false);
            // Refresh the page or update quote context
            window.location.reload();
          } catch (error) {
            logger.error("Error accepting quote", error);
            toast.error("خطا در پذیرش پیشنهاد");
            setShowAcceptQuoteDialog(false);
          }
        }}
        onClose={() => {
          setShowAcceptQuoteDialog(false);
        }}
      />
    </>
  );
}

export default memo(ChatSidebar);

