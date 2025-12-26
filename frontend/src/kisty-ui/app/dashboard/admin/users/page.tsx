"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import DeleteConfirmDialog from "../../../components/DeleteConfirmDialog";
import { formatDate, getRoleLabel, getStatusLabel } from "../../../data/demoUsers";
import { User } from "../../../types/user";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function UserManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
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

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getUsers();
        
        // Transform backend data to frontend format
        const transformedUsers: User[] = (Array.isArray(response) ? response : []).map((user: any) => {
          // Normalize role from backend format (CUSTOMER/SUPPLIER/ADMIN) to frontend format
          const normalizeRole = (role: string): "admin" | "user" | "supplier" => {
            const upperRole = role?.toUpperCase();
            if (upperRole === "CUSTOMER") return "user";
            if (upperRole === "SUPPLIER") return "supplier";
            if (upperRole === "ADMIN") return "admin";
            return role?.toLowerCase() as "admin" | "user" | "supplier" || "user";
          };

          return {
            id: user.id,
            name: user.fullName || user.name || "",
            phone: user.phone,
            email: user.email || "",
            role: normalizeRole(user.role),
            status: user.isBlocked ? "blocked" : (user.isActive ? "active" : "inactive"),
            createdAt: user.createdAt || user.created_at,
            updatedAt: user.updatedAt || user.updated_at,
          };
        });
        
        setUsers(transformedUsers);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت لیست کاربران");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchUsers();
    }
  }, [isAuthenticated, currentUser]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.phone.includes(query) ||
        user.email.toLowerCase().includes(query) ||
        getRoleLabel(user.role).toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleDelete = (user: User) => {
    setDeleteDialog({ isOpen: true, user });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.user) return;

    try {
      await apiClient.deleteUser(deleteDialog.user.id);
      setUsers(users.filter((u) => u.id !== deleteDialog.user!.id));
      toast.success(`کاربر ${deleteDialog.user.name} با موفقیت حذف شد`);
      setDeleteDialog({ isOpen: false, user: null });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "خطا در حذف کاربر");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "supplier":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
                مدیریت کاربران
              </h1>
              <p className="text-brand-medium-blue">
                مدیریت و نظارت بر کاربران پلتفرم
              </p>
            </div>
            <Link href="/dashboard/admin/users/create">
              <Button variant="primary" size="sm">
                <PlusIcon className="w-5 h-5" />
                افزودن کاربر جدید
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="جستجو بر اساس نام، شماره موبایل، ایمیل یا نقش..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">
              {users.length}
            </div>
            <div className="text-xs text-brand-medium-blue">کل کاربران</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {users.filter((u) => u.status === "active").length}
            </div>
            <div className="text-xs text-brand-medium-blue">کاربران فعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {users.filter((u) => u.role === "supplier").length}
            </div>
            <div className="text-xs text-brand-medium-blue">تولیدکنندگان</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {users.filter((u) => u.status === "blocked").length}
            </div>
            <div className="text-xs text-brand-medium-blue">کاربران مسدود</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    نام
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    شماره موبایل
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    ایمیل
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    نقش
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    تاریخ ثبت‌نام
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-brand-dark-blue">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-brand-medium-blue">
                      کاربری یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-brand-dark-blue font-medium">
                        {user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue font-mono">
                        {user.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                            user.status
                          )}`}
                        >
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/admin/users/edit/${user.id}`}>
                            <Button
                              variant="neutral"
                              size="sm"
                              className="p-2"
                              title="ویرایش"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="neutral"
                            size="sm"
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(user)}
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
          onClose={() => setDeleteDialog({ isOpen: false, user: null })}
          onConfirm={confirmDelete}
          message={
            deleteDialog.user
              ? `آیا از حذف کاربر "${deleteDialog.user.name}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

