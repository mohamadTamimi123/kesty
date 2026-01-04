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
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface Supplier {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  workshopName: string | null;
  workshopAddress: string | null;
  workshopPhone: string | null;
  isActive: boolean;
  isBlocked: boolean;
  isPremium: boolean;
  premiumLevel: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export default function SuppliersManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "blocked">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | "premium" | null;
    supplier: Supplier | null;
  }>({
    isOpen: false,
    type: null,
    supplier: null,
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

  // Fetch suppliers from API
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSuppliers();
        const transformedSuppliers: Supplier[] = (Array.isArray(response) ? response : []).map(
          (user: any) => ({
            id: user.id,
            fullName: user.fullName || user.name || "",
            phone: user.phone,
            email: user.email || "",
            workshopName: user.workshopName || null,
            workshopAddress: user.workshopAddress || null,
            workshopPhone: user.workshopPhone || null,
            isActive: user.isActive !== false,
            isBlocked: user.isBlocked === true,
            isPremium: user.isPremium === true,
            premiumLevel: user.premiumLevel || null,
            avatarUrl: user.avatarUrl || null,
            createdAt: user.createdAt || user.created_at,
            updatedAt: user.updatedAt || user.updated_at,
          })
        );
        setSuppliers(transformedSuppliers);
      } catch (error: unknown) {
        logger.error("Error fetching suppliers", error);
        toast.error("خطا در دریافت لیست تولیدکنندگان");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchSuppliers();
    }
  }, [isAuthenticated, currentUser]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((s) => s.isActive && !s.isBlocked);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((s) => !s.isActive && !s.isBlocked);
    } else if (statusFilter === "blocked") {
      filtered = filtered.filter((s) => s.isBlocked);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.fullName.toLowerCase().includes(query) ||
          s.phone.includes(query) ||
          s.email.toLowerCase().includes(query) ||
          (s.workshopName && s.workshopName.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [suppliers, searchQuery, statusFilter]);

  const handleApprove = (supplier: Supplier) => {
    setActionDialog({ isOpen: true, type: "approve", supplier });
  };

  const handleReject = (supplier: Supplier) => {
    setActionDialog({ isOpen: true, type: "reject", supplier });
  };

  const handlePremium = (supplier: Supplier) => {
    setActionDialog({ isOpen: true, type: "premium", supplier });
  };

  const confirmAction = async () => {
    if (!actionDialog.supplier || !actionDialog.type) return;

    try {
      if (actionDialog.type === "approve") {
        await apiClient.approveSupplier(actionDialog.supplier.id);
        toast.success(`تولیدکننده ${actionDialog.supplier.fullName} تایید شد`);
        setSuppliers(
          suppliers.map((s) =>
            s.id === actionDialog.supplier!.id
              ? { ...s, isActive: true, isBlocked: false }
              : s
          )
        );
      } else if (actionDialog.type === "reject") {
        await apiClient.rejectSupplier(actionDialog.supplier.id);
        toast.success(`تولیدکننده ${actionDialog.supplier.fullName} رد شد`);
        setSuppliers(
          suppliers.map((s) =>
            s.id === actionDialog.supplier!.id
              ? { ...s, isActive: false, isBlocked: true }
              : s
          )
        );
      } else if (actionDialog.type === "premium") {
        const isPremium = !actionDialog.supplier.isPremium;
        await apiClient.setSupplierPremium(
          actionDialog.supplier.id,
          isPremium,
          isPremium ? "GOLD" : null
        );
        toast.success(
          `وضعیت ویژه تولیدکننده ${actionDialog.supplier.fullName} تغییر کرد`
        );
        setSuppliers(
          suppliers.map((s) =>
            s.id === actionDialog.supplier!.id
              ? { ...s, isPremium, premiumLevel: isPremium ? "GOLD" : null }
              : s
          )
        );
      }
      setActionDialog({ isOpen: false, type: null, supplier: null });
    } catch (error: any) {
      logger.error("Error performing action", error);
      toast.error(error.response?.data?.message || "خطا در انجام عملیات");
    }
  };

  const getStatusBadge = (supplier: Supplier) => {
    if (supplier.isBlocked) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-300">
          مسدود شده
        </span>
      );
    }
    if (!supplier.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-300">
          در انتظار تایید
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-300">
        فعال
      </span>
    );
  };

  const stats = useMemo(() => {
    return {
      total: suppliers.length,
      active: suppliers.filter((s) => s.isActive && !s.isBlocked).length,
      pending: suppliers.filter((s) => !s.isActive && !s.isBlocked).length,
      blocked: suppliers.filter((s) => s.isBlocked).length,
      premium: suppliers.filter((s) => s.isPremium).length,
    };
  }, [suppliers]);

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
              مدیریت تولیدکنندگان
            </h1>
            <p className="text-brand-medium-blue">مدیریت و نظارت بر تولیدکنندگان پلتفرم</p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="جستجو بر اساس نام، شماره موبایل، ایمیل یا نام کارگاه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "all", label: "همه" },
              { id: "active", label: "فعال" },
              { id: "pending", label: "در انتظار تایید" },
              { id: "blocked", label: "مسدود شده" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id as any)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === filter.id
                    ? "bg-brand-medium-blue text-white"
                    : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-brand-light-gray"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">
              {stats.total}
            </div>
            <div className="text-xs text-brand-medium-blue">کل تولیدکنندگان</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.active}</div>
            <div className="text-xs text-brand-medium-blue">فعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
            <div className="text-xs text-brand-medium-blue">در انتظار تایید</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-red-600 mb-1">{stats.blocked}</div>
            <div className="text-xs text-brand-medium-blue">مسدود شده</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-purple-600 mb-1">{stats.premium}</div>
            <div className="text-xs text-brand-medium-blue">ویژه</div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    نام
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    کارگاه
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    تماس
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
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-medium-blue">
                      تولیدکننده‌ای یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {supplier.isPremium && (
                            <StarIconSolid className="w-5 h-5 text-yellow-500" />
                          )}
                          <span className="text-sm text-brand-dark-blue font-medium">
                            {supplier.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {supplier.workshopName || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-brand-medium-blue">
                          <div>{supplier.phone}</div>
                          {supplier.email && (
                            <div className="text-xs text-gray-500">{supplier.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(supplier)}</td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {formatDate(supplier.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Link href={`/dashboard/admin/users/edit/${supplier.id}`}>
                            <Button variant="neutral" size="sm" className="p-2" title="مشاهده">
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </Link>
                          {!supplier.isActive && !supplier.isBlocked && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="p-2"
                              onClick={() => handleApprove(supplier)}
                              title="تایید"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                          )}
                          {supplier.isActive && !supplier.isBlocked && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="p-2"
                              onClick={() => handleReject(supplier)}
                              title="رد"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="neutral"
                            size="sm"
                            className={`p-2 ${supplier.isPremium ? "text-yellow-600" : ""}`}
                            onClick={() => handlePremium(supplier)}
                            title={supplier.isPremium ? "حذف ویژه" : "ویژه کردن"}
                          >
                            <StarIcon className="w-4 h-4" />
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

        {/* Action Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={actionDialog.isOpen}
          onClose={() => setActionDialog({ isOpen: false, type: null, supplier: null })}
          onConfirm={confirmAction}
          message={
            actionDialog.type === "approve"
              ? `آیا از تایید تولیدکننده "${actionDialog.supplier?.fullName}" اطمینان دارید؟`
              : actionDialog.type === "reject"
              ? `آیا از رد تولیدکننده "${actionDialog.supplier?.fullName}" اطمینان دارید؟`
              : actionDialog.type === "premium"
              ? `آیا می‌خواهید وضعیت ویژه تولیدکننده "${actionDialog.supplier?.fullName}" را ${
                  actionDialog.supplier?.isPremium ? "حذف" : "فعال"
                } کنید؟`
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

