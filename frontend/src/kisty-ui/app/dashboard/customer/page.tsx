"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import StatsCard from "../../components/StatsCard";
import { Project, ProjectStatus } from "../../types/project";
import { QuoteStats } from "../../types/quote";
import apiClient from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";
import toast from "react-hot-toast";
import logger from "../../utils/logger";
import {
  PlusCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

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

const getStatusIcon = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.PENDING:
      return <ClockIcon className="w-4 h-4" />;
    case ProjectStatus.IN_PROGRESS:
      return <DocumentTextIcon className="w-4 h-4" />;
    case ProjectStatus.COMPLETED:
      return <CheckCircleIcon className="w-4 h-4" />;
    case ProjectStatus.CANCELLED:
      return <XCircleIcon className="w-4 h-4" />;
  }
};

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { unreadCount, openChatSidebar } = useChat();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteStatsMap, setQuoteStatsMap] = useState<Record<string, QuoteStats>>({});
  const isFetchingRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Batch fetch quote stats with concurrency limit
  const fetchQuoteStatsBatch = async (
    projects: Project[],
    batchSize: number = 3,
    delayBetweenBatches: number = 200
  ): Promise<Record<string, QuoteStats>> => {
    const statsMap: Record<string, QuoteStats> = {};
    
    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (project) => {
        try {
          const stats = await apiClient.getQuoteStats(project.id);
          return { projectId: project.id, stats };
        } catch (error) {
          logger.error(`Error fetching quote stats for project ${project.id}`, error);
          return {
            projectId: project.id,
            stats: {
              total: 0,
              pending: 0,
              accepted: 0,
              rejected: 0,
              averagePrice: 0,
              minPrice: 0,
              maxPrice: 0,
            } as QuoteStats,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ projectId, stats }) => {
        if (stats) {
          statsMap[projectId] = stats;
        }
      });

      // Add delay between batches to prevent server overload
      if (i + batchSize < projects.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return statsMap;
  };

  const fetchProjects = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      logger.info("Fetch already in progress, skipping...");
      return;
    }

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      logger.info("Fetching customer projects...");
      
      const response = await apiClient.getMyProjects();
      
      // Handle different response formats
      let projectsArray: Project[] = [];
      if (Array.isArray(response)) {
        projectsArray = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        projectsArray = response.data;
      } else if (response && typeof response === 'object' && 'projects' in response && Array.isArray(response.projects)) {
        projectsArray = response.projects;
      }
      
      logger.info(`Fetched ${projectsArray.length} projects`);
      setProjects(projectsArray);

      // Fetch quote stats for pending projects (with batching)
      const pendingProjects = projectsArray.filter(
        (p) => p.status === ProjectStatus.PENDING
      );
      
      if (pendingProjects.length > 0) {
        logger.info(`Fetching quote stats for ${pendingProjects.length} pending projects (batched)`);
        const statsMap = await fetchQuoteStatsBatch(pendingProjects, 3, 200);
        setQuoteStatsMap(statsMap);
        logger.info("Quote stats map updated:", statsMap);
      } else {
        setQuoteStatsMap({});
      }
    } catch (error: unknown) {
      logger.error("Error fetching projects", error);
      const errorMessage = (error as any)?.response?.data?.message || 
                          (error as any)?.message || 
                          "خطا در دریافت پروژه‌ها";
      toast.error(errorMessage);
      console.error("Full error details:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAuthenticated]);

  // Initial fetch - only when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      // Clear any pending timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Debounce the fetch to avoid rapid calls
      fetchTimeoutRef.current = setTimeout(() => {
        fetchProjects();
      }, 100);
    } else {
      setIsLoading(false);
      setProjects([]);
      setQuoteStatsMap({});
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only depend on isAuthenticated, not fetchProjects

  // Refresh data periodically - increased interval to reduce server load
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      // Only refresh if not currently fetching
      if (!isFetchingRef.current) {
        fetchProjects();
      }
    }, 60000); // Refresh every 60 seconds (increased from 30)

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only depend on isAuthenticated

  // Calculate stats
  const stats = {
    total: projects.length,
    pending: projects.filter((p) => p.status === ProjectStatus.PENDING).length,
    inProgress: projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS).length,
    completed: projects.filter((p) => p.status === ProjectStatus.COMPLETED).length,
    totalQuotes: Object.values(quoteStatsMap).reduce((sum, stats) => sum + (stats?.total || 0), 0),
    pendingQuotes: Object.values(quoteStatsMap).reduce((sum, stats) => sum + (stats?.pending || 0), 0),
  };

  // Get recent projects (last 5, sorted by creation date - newest first)
  const recentProjects = [...projects]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Newest first
    })
    .slice(0, 5);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="در حال بارگذاری اطلاعات..." />;
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<DocumentTextIcon className="w-16 h-16 text-brand-medium-gray" />}
        title="لطفاً وارد شوید"
        description="برای مشاهده داشبورد خود، لطفاً وارد حساب کاربری شوید."
        actionLabel="ورود به حساب کاربری"
        actionHref="/login"
      />
    );
  }

  return (
    <div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            خوش آمدید {user?.fullName || user?.name || "کاربر عزیز"}!
          </h1>
          <p className="text-brand-medium-blue">
            مدیریت درخواست‌های پروژه و ارتباط با تولیدکنندگان
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<DocumentTextIcon className="w-6 h-6" />}
            value={stats.total}
            label="کل پروژه‌ها"
            subtitle={stats.total === 0 ? "هنوز پروژه‌ای ثبت نشده" : undefined}
          />

          <StatsCard
            icon={<ClockIcon className="w-6 h-6" />}
            value={stats.pending}
            label="در انتظار"
            subtitle={
              stats.pendingQuotes > 0
                ? `${stats.pendingQuotes} پیشنهاد در انتظار بررسی`
                : stats.pending === 0 && stats.total > 0
                ? "همه پروژه‌ها در حال انجام یا تکمیل شده"
                : undefined
            }
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            subtitleClassName={stats.pendingQuotes > 0 ? "text-yellow-600 font-medium" : undefined}
          />

          <StatsCard
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
            value={unreadCount > 0 ? unreadCount : 0}
            label="پیام‌های جدید"
            onClick={() => openChatSidebar()}
            iconBgColor={unreadCount > 0 ? "bg-blue-100" : "bg-brand-light-sky"}
            iconColor={unreadCount > 0 ? "text-blue-600" : "text-brand-medium-blue"}
            valueColor={unreadCount > 0 ? "text-blue-600" : "text-brand-dark-blue"}
            badge={
              unreadCount > 0 ? (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : undefined
            }
          />

          <StatsCard
            icon={<CheckCircleIcon className="w-6 h-6" />}
            value={stats.completed}
            label="تکمیل شده"
            subtitle={
              stats.completed > 0
                ? `${Math.round((stats.completed / stats.total) * 100)}% از کل پروژه‌ها`
                : undefined
            }
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            subtitleClassName={stats.completed > 0 ? "text-green-600" : undefined}
          />
        </div>

        {/* Additional Stats Row */}
        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-brand-medium-blue">پروژه‌های در حال انجام</span>
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">
                {stats.inProgress}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-brand-medium-blue">کل پیشنهادات دریافت شده</span>
                <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">
                {stats.totalQuotes}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-brand-medium-blue">پیشنهادات در انتظار</span>
                <ClockIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">
                {stats.pendingQuotes}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/customer/projects/create">
            <div className="bg-gradient-to-br from-brand-medium-blue to-brand-dark-blue rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <PlusCircleIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1 font-display">
                    ثبت درخواست جدید
                  </h3>
                  <p className="text-sm text-white/90">
                    پروژه جدید خود را ثبت کنید
                  </p>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-white group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/customer/projects">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-light-sky rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-brand-medium-blue" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-dark-blue mb-1 font-display">
                    مشاهده همه پروژه‌ها
                  </h3>
                  <p className="text-sm text-brand-medium-blue">
                    مدیریت و پیگیری پروژه‌های شما
                  </p>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-brand-medium-blue group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="p-6 border-b border-brand-medium-gray">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-brand-dark-blue font-display">
                پروژه‌های اخیر
              </h2>
              {projects.length > 5 && (
                <Link
                  href="/dashboard/customer/projects"
                  className="text-sm text-brand-medium-blue hover:text-brand-dark-blue flex items-center gap-1"
                >
                  مشاهده همه
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="divide-y divide-brand-medium-gray">
            {recentProjects.length === 0 ? (
              <EmptyState
                icon={<DocumentTextIcon className="w-16 h-16 text-brand-medium-gray" />}
                title="هنوز پروژه‌ای ثبت نکرده‌اید"
                description="برای شروع، اولین پروژه خود را ثبت کنید و از تولیدکنندگان پیشنهاد دریافت کنید."
                actionLabel="ثبت اولین پروژه"
                actionHref="/dashboard/customer/projects/create"
              />
            ) : (
              recentProjects.map((project) => {
                const quoteStats = quoteStatsMap[project.id];
                const hasQuotes = quoteStats && quoteStats.total > 0;
                
                return (
                  <div
                    key={project.id}
                    className="block p-6 hover:bg-brand-off-white transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/customer/projects/${project.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-brand-dark-blue">
                            {project.title}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {getStatusIcon(project.status)}
                            {getStatusLabel(project.status)}
                          </span>
                          {hasQuotes && project.status === ProjectStatus.PENDING && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-300 flex items-center gap-1">
                              <CurrencyDollarIcon className="w-3 h-3" />
                              {quoteStats.total} پیشنهاد
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-brand-medium-blue line-clamp-2 mb-3">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-brand-medium-blue">
                          {project.city && (
                            <span className="flex items-center gap-1">
                              📍 {project.city.title}
                            </span>
                          )}
                          {project.category && (
                            <span className="flex items-center gap-1">
                              🏷️ {project.category.title}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            📅 {formatDate(project.createdAt)}
                          </span>
                          {hasQuotes && quoteStats.pending > 0 && (
                            <span className="flex items-center gap-1 text-yellow-600">
                              ⏳ {quoteStats.pending} پیشنهاد در انتظار
                            </span>
                          )}
                          {hasQuotes && quoteStats.accepted > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              ✓ پیشنهاد پذیرفته شده
                            </span>
                          )}
                        </div>
                        {hasQuotes && project.status === ProjectStatus.PENDING && (
                          <div className="mt-3">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/customer/projects/${project.id}/quotes`);
                              }}
                            >
                              <CurrencyDollarIcon className="w-4 h-4 ml-2" />
                              مقایسه پیشنهادات
                            </Button>
                          </div>
                        )}
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-brand-medium-gray mr-4 flex-shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
    </div>
  );
}
