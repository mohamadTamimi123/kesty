"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../components/Button";
import { Project, ProjectStatus } from "../../types/project";
import apiClient from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  PlusCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowRightIcon,
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMyProjects();
        setProjects(Array.isArray(response) ? response : []);
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت پروژه‌ها");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  // Calculate stats
  const stats = {
    total: projects.length,
    pending: projects.filter((p) => p.status === ProjectStatus.PENDING).length,
    inProgress: projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS).length,
    completed: projects.filter((p) => p.status === ProjectStatus.COMPLETED).length,
  };

  // Get recent projects (last 5)
  const recentProjects = projects.slice(0, 5);

  if (isLoading) {
    return (
      <div className="text-center text-brand-medium-blue py-12">
        در حال بارگذاری...
      </div>
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
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brand-light-sky rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-brand-medium-blue" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.total}
            </div>
            <div className="text-sm text-brand-medium-blue">کل پروژه‌ها</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.pending}
            </div>
            <div className="text-sm text-brand-medium-blue">در انتظار</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.inProgress}
            </div>
            <div className="text-sm text-brand-medium-blue">در حال انجام</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.completed}
            </div>
            <div className="text-sm text-brand-medium-blue">تکمیل شده</div>
          </div>
        </div>

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
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-brand-medium-gray mx-auto mb-4" />
                <p className="text-brand-medium-blue mb-4">
                  هنوز پروژه‌ای ثبت نکرده‌اید
                </p>
                <Link href="/dashboard/customer/projects/create">
                  <Button variant="primary">
                    <PlusCircleIcon className="w-5 h-5 ml-2" />
                    ثبت اولین پروژه
                  </Button>
                </Link>
              </div>
            ) : (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/customer/projects/${project.id}`}
                  className="block p-6 hover:bg-brand-off-white transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
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
                      </div>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-brand-medium-gray mr-4 flex-shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
    </div>
  );
}
