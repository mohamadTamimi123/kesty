"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import { Project, ProjectStatus } from "../../../types/project";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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
  const { user: currentUser, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
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
        toast.error(error.response?.data?.message || "خطا در دریافت لیست پروژه‌ها");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="جستجو در پروژه‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "ALL")}
              className="px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              <option value={ProjectStatus.PENDING}>در انتظار</option>
              <option value={ProjectStatus.IN_PROGRESS}>در حال انجام</option>
              <option value={ProjectStatus.COMPLETED}>تکمیل شده</option>
              <option value={ProjectStatus.CANCELLED}>لغو شده</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">
              {projects.length}
            </div>
            <div className="text-xs text-brand-medium-blue">کل پروژه‌ها</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {projects.filter((p) => p.status === ProjectStatus.PENDING).length}
            </div>
            <div className="text-xs text-brand-medium-blue">در انتظار</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS).length}
            </div>
            <div className="text-xs text-brand-medium-blue">در حال انجام</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {projects.filter((p) => p.status === ProjectStatus.COMPLETED).length}
            </div>
            <div className="text-xs text-brand-medium-blue">تکمیل شده</div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center border border-brand-medium-gray">
              <p className="text-brand-medium-blue mb-4">
                {searchQuery || statusFilter !== "ALL"
                  ? "پروژه‌ای با این فیلترها یافت نشد"
                  : "هنوز پروژه‌ای ثبت نکرده‌اید"}
              </p>
              {!searchQuery && statusFilter === "ALL" && (
                <Link href="/dashboard/customer/projects/create">
                  <Button variant="primary">ثبت اولین پروژه</Button>
                </Link>
              )}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Link key={project.id} href={`/dashboard/customer/projects/${project.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-brand-dark-blue mb-2 font-display">
                        {project.title}
                      </h3>
                      <p className="text-sm text-brand-medium-blue line-clamp-2 mb-3">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-brand-medium-blue">
                        {project.city && (
                          <span>📍 {project.city.title}</span>
                        )}
                        {project.category && (
                          <span>🏷️ {project.category.title}</span>
                        )}
                        <span>📅 {formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
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

