"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Message } from "../types/messaging";
import { CheckIcon } from "@heroicons/react/24/solid";
import { CheckIcon as CheckOutlineIcon } from "@heroicons/react/24/outline";
import ProjectMessageCard from "./ProjectMessageCard";
import QuoteMessageCard from "./QuoteMessageCard";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
  senderName?: string;
  conversationProjectId?: string | null;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = false,
  avatarUrl,
  senderName,
  conversationProjectId,
}: MessageBubbleProps) {
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isProjectNotification = message.metadata?.type === 'project_notification';
  const isQuoteMessage = message.metadata?.type === 'quote' || 
                         (message.content?.includes('پیشنهاد جدید') && message.content?.includes('قیمت'));
  const projectId = message.metadata?.projectId || conversationProjectId;

  const getReadReceiptIcon = () => {
    if (!isOwnMessage) return null;

    // Single tick: sent but not delivered
    if (!message.deliveredAt) {
      return (
        <CheckOutlineIcon className="w-3 h-3 text-gray-400 ml-1" />
      );
    }

    // Double tick: delivered but not read
    if (!message.isRead) {
      return (
        <div className="flex items-center ml-1">
          <CheckIcon className="w-3 h-3 text-gray-400" />
          <CheckIcon className="w-3 h-3 text-gray-400 -mr-1" />
        </div>
      );
    }

    // Double blue tick: read
    return (
      <div className="flex items-center ml-1">
        <CheckIcon className="w-3 h-3 text-blue-500" />
        <CheckIcon className="w-3 h-3 text-blue-500 -mr-1" />
      </div>
    );
  };

  return (
    <div
      className={`flex gap-2 mb-4 ${
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-light-sky flex items-center justify-center overflow-hidden">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={senderName || "User"}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="text-xs font-semibold text-brand-medium-blue">
                {(senderName || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col max-w-[70%] ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        {showAvatar && !isOwnMessage && senderName && (
          <span className="text-xs text-brand-medium-blue mb-1 px-1">
            {senderName}
          </span>
        )}

        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? "bg-brand-medium-blue text-white rounded-tr-none"
              : "bg-white border border-brand-medium-gray text-brand-dark-blue rounded-tl-none"
          }`}
        >
          {/* Show project notification card instead of plain text */}
          {isProjectNotification && projectId && !isOwnMessage ? (
            <ProjectMessageCard message={message} />
          ) : isQuoteMessage ? (
            /* Show quote card for quote messages (both sent and received) */
            <QuoteMessageCard 
              message={message} 
              projectId={projectId}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        <div
          className={`flex items-center gap-1 mt-1 px-1 ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-xs text-brand-medium-gray">
            {formatTime(message.createdAt)}
          </span>
          {getReadReceiptIcon()}
        </div>
      </div>
    </div>
  );
}
