export interface Conversation {
  id: string;
  customerId: string;
  supplierId: string;
  customer: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  supplier: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  lastMessageAt: string | null;
  customerUnreadCount: number;
  supplierUnreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageData {
  conversationId: string;
  content: string;
}

export interface CreateConversationData {
  supplierId: string;
}

