"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import DeleteConfirmDialog from "../../../components/DeleteConfirmDialog";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

interface Conversation {
  id: string;
  customerId: string;
  supplierId: string;
  customer?: {
    fullName: string;
    phone: string;
  };
  supplier?: {
    fullName: string;
    phone: string;
    workshopName: string | null;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function ConversationsManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    conversation: Conversation | null;
  }>({
    isOpen: false,
    conversation: null,
  });

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (currentUser?.role !== "admin" && currentUser?.role !== "ADMIN") {
      toast.error("شما دسترسی به این صفحه ندارید");
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, currentUser, router]);

  // Fetch conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getAllConversations({ limit: 100 });
        const conversationsData = Array.isArray(response) ? response : response?.data || [];
        setConversations(conversationsData);
      } catch (error: unknown) {
        logger.error("Error fetching conversations", error);
        toast.error("خطا در دریافت لیست مکالمات");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchConversations();
    }
  }, [isAuthenticated, currentUser]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.customer?.fullName && c.customer.fullName.toLowerCase().includes(query)) ||
        (c.customer?.phone && c.customer.phone.includes(query)) ||
        (c.supplier?.fullName && c.supplier.fullName.toLowerCase().includes(query)) ||
        (c.supplier?.phone && c.supplier.phone.includes(query)) ||
        (c.supplier?.workshopName &&
          c.supplier.workshopName.toLowerCase().includes(query)) ||
        (c.lastMessage?.content && c.lastMessage.content.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  const handleDelete = (conversation: Conversation) => {
    setDeleteDialog({ isOpen: true, conversation });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.conversation) return;

    try {
      await apiClient.deleteConversation(deleteDialog.conversation.id);
      setConversations(
        conversations.filter((c) => c.id !== deleteDialog.conversation!.id)
      );
      toast.success("مکالمه با موفقیت حذف شد");
      setDeleteDialog({ isOpen: false, conversation: null });
    } catch (error: any) {
      logger.error("Error deleting conversation", error);
      toast.error(error.message || error.response?.data?.message || "خطا در حذف مکالمه");
    }
  };

  const stats = useMemo(() => {
    return {
      total: conversations.length,
      withUnread: conversations.filter((c) => (c.unreadCount || 0) > 0).length,
      totalUnread: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    };
  }, [conversations]);

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">در حال بارگذاری...</div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
              مدیریت مکالمات
            </h1>
            <p className="text-brand-medium-blue">مدیریت و نظارت بر مکالمات پلتفرم</p>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="جستجو بر اساس نام مشتری، تولیدکننده، کارگاه یا محتوای پیام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">{stats.total}</div>
            <div className="text-xs text-brand-medium-blue">کل مکالمات</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.withUnread}</div>
            <div className="text-xs text-brand-medium-blue">مکالمات با پیام خوانده نشده</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-red-600 mb-1">{stats.totalUnread}</div>
            <div className="text-xs text-brand-medium-blue">کل پیام‌های خوانده نشده</div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    مشتری
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    تولیدکننده
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    آخرین پیام
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    تاریخ
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-brand-dark-blue">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-brand-medium-blue">
                      مکالمه‌ای یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredConversations.map((conversation) => (
                    <tr
                      key={conversation.id}
                      className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm text-brand-dark-blue font-medium">
                          {conversation.customer?.fullName || "-"}
                        </div>
                        {conversation.customer?.phone && (
                          <div className="text-xs text-brand-medium-blue">
                            {conversation.customer.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-brand-dark-blue font-medium">
                          {conversation.supplier?.fullName || "-"}
                        </div>
                        {conversation.supplier?.workshopName && (
                          <div className="text-xs text-brand-medium-blue">
                            {conversation.supplier.workshopName}
                          </div>
                        )}
                        {conversation.supplier?.phone && (
                          <div className="text-xs text-gray-500">
                            {conversation.supplier.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {conversation.lastMessage ? (
                          <div>
                            <div className="text-sm text-brand-dark-blue line-clamp-2">
                              {conversation.lastMessage.content.substring(0, 100)}
                              {conversation.lastMessage.content.length > 100 && "..."}
                            </div>
                            {conversation.unreadCount && conversation.unreadCount > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                {conversation.unreadCount} پیام خوانده نشده
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">بدون پیام</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {conversation.lastMessage
                          ? formatDate(conversation.lastMessage.createdAt)
                          : formatDate(conversation.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/messaging/${conversation.id}`}>
                            <Button variant="neutral" size="sm" className="p-2" title="مشاهده">
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="neutral"
                            size="sm"
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(conversation)}
                            title="حذف"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, conversation: null })}
          onConfirm={confirmDelete}
          message={
            deleteDialog.conversation
              ? "آیا از حذف این مکالمه اطمینان دارید؟ این عمل غیرقابل بازگشت است."
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

