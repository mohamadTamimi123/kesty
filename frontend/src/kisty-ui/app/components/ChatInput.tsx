"use client";

import { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useMessagingSocket } from "../hooks/useMessagingSocket";

interface ChatInputProps {
  conversationId: string;
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({
  conversationId,
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { emitTyping } = useMessagingSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleTyping = () => {
    // Emit typing indicator
    emitTyping(conversationId, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(conversationId, false);
    }, 3000);
  };

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;

    // Stop typing indicator
    emitTyping(conversationId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const content = message.trim();
    setMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      setIsSending(true);
      await onSend(content);
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup typing indicator on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      emitTyping(conversationId, false);
    };
  }, [conversationId, emitTyping]);

  return (
    <div className="border-t border-brand-medium-gray bg-white p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="پیام خود را بنویسید..."
            disabled={disabled || isSending}
            rows={1}
            className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue resize-none text-brand-dark-blue disabled:bg-gray-50 disabled:cursor-not-allowed"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending || disabled}
          className="p-3 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title="ارسال (Enter)"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-brand-medium-gray mt-1 text-right">
        Enter برای ارسال، Shift+Enter برای خط جدید
      </p>
    </div>
  );
}
