"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import { Project, ProjectStatus } from "../../../types/project";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import { getErrorMessage } from "../../../utils/errorHandler";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  TagIcon,
  CalendarIcon,
  DocumentTextIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../components/LoadingSpinner";
import EmptyState from "../../../components/EmptyState";
import { debounce } from "../../../utils/debounce";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    [ProjectStatus.PENDING]: 'در انتظار',
    [ProjectStatus.IN_PROGRESS]: 'در حال انجام',
    [ProjectStatus.COMPLETED]: 'تکمیل شده',
    [ProjectStatus.CANCELLED]: 'لغو شده',
  };
  return labels[status];
};

const getStatusColor = (status: ProjectStatus): string => {
  const colors: Record<ProjectStatus, string> = {
    [ProjectStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [ProjectStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-300',
    [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-300',
    [ProjectStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status];
};

export default function MyProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getMyProjects();
      // Backend returns { data: Project[], total, page, limit, totalPages }
      // Handle both array and object responses
      if (Array.isArray(response)) {
        setProjects(response);
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setProjects([]);
      }
    } catch (error: unknown) {
      logger.error("Error fetching projects", error);
      toast.error(getErrorMessage(error));
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  // Check for refresh flag from create page
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately when component mounts or pathname changes
    const checkRefresh = () => {
      const refreshFlag = localStorage.getItem("refreshProjects");
      if (refreshFlag && pathname === "/dashboard/customer/projects") {
        localStorage.removeItem("refreshProjects");
        // Use a longer delay to ensure navigation is complete
        setTimeout(() => {
          fetchProjects();
        }, 300);
      }
    };

    checkRefresh();

    // Also listen for storage events in case of multiple tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "refreshProjects" && e.newValue && pathname === "/dashboard/customer/projects") {
        localStorage.removeItem("refreshProjects");
        setTimeout(() => {
          fetchProjects();
        }, 300);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isAuthenticated, pathname, fetchProjects]);

  // Refresh projects when page becomes visible (user returns to tab or navigates back)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && pathname === "/dashboard/customer/projects") {
        fetchProjects();
      }
    };

    const handlePageshow = (event: PageTransitionEvent) => {
      // Refresh when navigating back to this page (from browser back button or cache)
      if (pathname === "/dashboard/customer/projects") {
        fetchProjects();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageshow);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageshow);
    };
  }, [isAuthenticated, fetchProjects, pathname]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
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
                درخواست‌های من
              </h1>
              <p className="text-brand-medium-blue">
                مدیریت و نظارت بر پروژه‌های شما
              </p>
            </div>
            <Link href="/dashboard/customer/projects/create">
              <Button variant="primary" size="sm">
                <PlusIcon className="w-5 h-5" />
                ثبت درخواست جدید
              </Button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="جستجو در پروژه‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue bg-white transition-all hover:border-brand-medium-blue"
              />
            </div>
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue pointer-events-none">
                <FunnelIcon className="w-5 h-5" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "ALL")}
                className="w-full pr-10 pl-4 py-2.5 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue bg-white transition-all hover:border-brand-medium-blue appearance-none cursor-pointer"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value={ProjectStatus.PENDING}>در انتظار</option>
                <option value={ProjectStatus.IN_PROGRESS}>در حال انجام</option>
                <option value={ProjectStatus.COMPLETED}>تکمیل شده</option>
                <option value={ProjectStatus.CANCELLED}>لغو شده</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-5 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-brand-dark-blue">
                {projects.length}
              </div>
              <DocumentTextIcon className="w-8 h-8 text-brand-medium-blue opacity-50" />
            </div>
            <div className="text-sm font-medium text-brand-medium-blue">کل پروژه‌ها</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border border-yellow-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-yellow-600">
                {projects.filter((p) => p.status === ProjectStatus.PENDING).length}
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
            <div className="text-sm font-medium text-brand-medium-blue">در انتظار</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border border-blue-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-blue-600">
                {projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS).length}
              </div>
              <ClockIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
            <div className="text-sm font-medium text-brand-medium-blue">در حال انجام</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border border-green-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-green-600">
                {projects.filter((p) => p.status === ProjectStatus.COMPLETED).length}
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
            <div className="text-sm font-medium text-brand-medium-blue">تکمیل شده</div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <EmptyState
              title={
                debouncedSearchQuery || statusFilter !== "ALL"
                  ? "پروژه‌ای با این فیلترها یافت نشد"
                  : "هنوز پروژه‌ای ثبت نکرده‌اید"
              }
              description={
                debouncedSearchQuery || statusFilter !== "ALL"
                  ? "لطفا فیلترها را تغییر دهید"
                  : "اولین پروژه خود را ثبت کنید تا تولیدکنندگان بتوانند به شما پیشنهاد دهند"
              }
              action={
                !debouncedSearchQuery && statusFilter === "ALL" ? (
                  <Link href="/dashboard/customer/projects/create">
                    <Button variant="primary">ثبت اولین پروژه</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            filteredProjects.map((project, index) => (
              <Link key={project.id} href={`/dashboard/customer/projects/${project.id}`}>
                <div
                  className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-xl hover:border-brand-medium-blue transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-brand-dark-blue mb-2 font-display group-hover:text-brand-medium-blue transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-brand-medium-blue line-clamp-2 mb-4 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-brand-medium-blue">
                        {project.city && (
                          <span className="flex items-center gap-1.5">
                            <MapPinIcon className="w-4 h-4" />
                            {project.city.title}
                          </span>
                        )}
                        {project.category && (
                          <span className="flex items-center gap-1.5">
                            <TagIcon className="w-4 h-4" />
                            {project.category.title}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDate(project.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

