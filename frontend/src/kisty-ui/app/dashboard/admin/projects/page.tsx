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
  FunnelIcon,
} from "@heroicons/react/24/outline";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  isPublic: boolean;
  customerId: string;
  customer?: {
    fullName: string;
    phone: string;
  };
  cityId: string;
  city?: {
    title: string;
  };
  categoryId: string;
  category?: {
    title: string;
  };
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

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    PENDING: "در انتظار",
    IN_PROGRESS: "در حال انجام",
    COMPLETED: "تکمیل شده",
    CANCELLED: "لغو شده",
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-300";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export default function ProjectsManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; project: Project | null }>({
    isOpen: false,
    project: null,
  });
  const [showFilters, setShowFilters] = useState(false);

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

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getAllProjects({ limit: 100 });
        
        // Handle different response formats
        let projectsData: Project[] = [];
        if (Array.isArray(response)) {
          projectsData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          projectsData = response.data;
        } else if (response?.projects && Array.isArray(response.projects)) {
          projectsData = response.projects;
        }
        
        logger.info(`Fetched ${projectsData.length} projects for admin`);
        setProjects(projectsData);
      } catch (error: unknown) {
        logger.error("Error fetching projects", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت لیست پروژه‌ها";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchProjects();
    }
  }, [isAuthenticated, currentUser]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.customer?.fullName && p.customer.fullName.toLowerCase().includes(query)) ||
          (p.city?.title && p.city.title.toLowerCase().includes(query)) ||
          (p.category?.title && p.category.title.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [projects, searchQuery, statusFilter]);

  const handleDelete = (project: Project) => {
    setDeleteDialog({ isOpen: true, project });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.project) return;

    try {
      await apiClient.deleteProject(deleteDialog.project.id);
      setProjects(projects.filter((p) => p.id !== deleteDialog.project!.id));
      toast.success(`پروژه ${deleteDialog.project.title} با موفقیت حذف شد`);
      setDeleteDialog({ isOpen: false, project: null });
    } catch (error: any) {
      logger.error("Error deleting project", error);
      toast.error(error.response?.data?.message || "خطا در حذف پروژه");
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      await apiClient.updateProjectStatus(projectId, newStatus);
      setProjects(
        projects.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      toast.success("وضعیت پروژه با موفقیت تغییر کرد");
    } catch (error: any) {
      logger.error("Error updating project status", error);
      toast.error(error.response?.data?.message || "خطا در تغییر وضعیت پروژه");
    }
  };

  const stats = useMemo(() => {
    return {
      total: projects.length,
      pending: projects.filter((p) => p.status === "PENDING").length,
      inProgress: projects.filter((p) => p.status === "IN_PROGRESS").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      cancelled: projects.filter((p) => p.status === "CANCELLED").length,
      public: projects.filter((p) => p.isPublic).length,
    };
  }, [projects]);

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
              مدیریت پروژه‌ها
            </h1>
            <p className="text-brand-medium-blue">مدیریت و نظارت بر پروژه‌های پلتفرم</p>
          </div>

          <div className="flex gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="جستجو بر اساس عنوان، توضیحات، مشتری، شهر یا دسته‌بندی..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="neutral"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              <FunnelIcon className="w-5 h-5 ml-2" />
              فیلتر
            </Button>
          </div>

          {/* Status Filter */}
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {[
                { id: "all", label: "همه" },
                { id: "PENDING", label: "در انتظار" },
                { id: "IN_PROGRESS", label: "در حال انجام" },
                { id: "COMPLETED", label: "تکمیل شده" },
                { id: "CANCELLED", label: "لغو شده" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
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
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">{stats.total}</div>
            <div className="text-xs text-brand-medium-blue">کل پروژه‌ها</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
            <div className="text-xs text-brand-medium-blue">در انتظار</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.inProgress}</div>
            <div className="text-xs text-brand-medium-blue">در حال انجام</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.completed}</div>
            <div className="text-xs text-brand-medium-blue">تکمیل شده</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-red-600 mb-1">{stats.cancelled}</div>
            <div className="text-xs text-brand-medium-blue">لغو شده</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-purple-600 mb-1">{stats.public}</div>
            <div className="text-xs text-brand-medium-blue">عمومی</div>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    عنوان
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    مشتری
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    شهر
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    دسته‌بندی
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    تاریخ ایجاد
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-brand-dark-blue">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-brand-medium-blue">
                      پروژه‌ای یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm text-brand-dark-blue font-medium">
                          {project.title}
                        </div>
                        <div className="text-xs text-brand-medium-blue mt-1 line-clamp-2">
                          {project.description.substring(0, 100)}
                          {project.description.length > 100 && "..."}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {project.customer?.fullName || "-"}
                        {project.customer?.phone && (
                          <div className="text-xs text-gray-500">{project.customer.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {project.city?.title || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {project.category?.title || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={project.status}
                          onChange={(e) => handleStatusChange(project.id, e.target.value)}
                          className={`text-xs font-medium border rounded-full px-2 py-1 ${getStatusBadgeClass(
                            project.status
                          )} focus:outline-none focus:ring-2 focus:ring-brand-medium-blue`}
                        >
                          <option value="PENDING">در انتظار</option>
                          <option value="IN_PROGRESS">در حال انجام</option>
                          <option value="COMPLETED">تکمیل شده</option>
                          <option value="CANCELLED">لغو شده</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {formatDate(project.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/customer/projects/${project.id}`}>
                            <Button variant="neutral" size="sm" className="p-2" title="مشاهده">
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="neutral"
                            size="sm"
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(project)}
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
          onClose={() => setDeleteDialog({ isOpen: false, project: null })}
          onConfirm={confirmDelete}
          message={
            deleteDialog.project
              ? `آیا از حذف پروژه "${deleteDialog.project.title}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

