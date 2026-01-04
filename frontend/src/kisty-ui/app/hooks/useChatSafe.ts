"use client";

import { useContext } from "react";
import { ChatContext, ChatContextType } from "../contexts/ChatContext";

/**
 * Safe hook to access ChatContext - returns null if context is not available
 * Useful for components that might be used outside ChatProvider
 */
export function useChatSafe(): ChatContextType | null {
  try {
    const context = useContext(ChatContext);
    return context || null;
  } catch {
    return null;
  }
}
