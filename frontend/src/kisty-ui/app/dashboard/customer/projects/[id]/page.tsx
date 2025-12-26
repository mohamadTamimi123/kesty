"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../components/MobileLayout";
import Button from "../../../../components/Button";
import { Project, ProjectStatus } from "../../../../types/project";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";

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

const getFileUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http')) return fileUrl;
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${apiUrl}/api${path}`;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { isAuthenticated } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const projectData = await apiClient.getProjectById(projectId);
        setProject(projectData);
      } catch (error: any) {
        console.error("Error fetching project:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت اطلاعات پروژه");
        router.push("/dashboard/customer/projects");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && projectId) {
      fetchProject();
    }
  }, [isAuthenticated, projectId, router]);

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!project) {
    return null;
  }

  // Mock messages and proposals - will be replaced with real API call later
  const messages = [
    { id: '1', sender: 'کارگاه نمونه 1', content: 'سلام، آیا می‌توانم جزئیات بیشتری دریافت کنم؟', date: new Date() },
    { id: '2', sender: 'کارگاه نمونه 2', content: 'پیش‌فاکتور ارسال شد', date: new Date() },
  ];

  const proposals = [
    { id: '1', supplier: 'کارگاه نمونه 1', price: '5000000', rating: 4.8, message: 'قیمت پیشنهادی: 5,000,000 تومان' },
    { id: '2', supplier: 'کارگاه نمونه 2', price: '4500000', rating: 4.6, message: 'قیمت پیشنهادی: 4,500,000 تومان' },
  ];

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/customer/projects"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowRightIcon className="w-4 h-4 ml-1" />
            بازگشت به لیست پروژه‌ها
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
                {project.title}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-brand-medium-blue">
                {project.city && <span>📍 {project.city.title}</span>}
                {project.category && <span>🏷️ {project.category.title}</span>}
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

        {/* Project Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-brand-medium-gray">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
            جزئیات پروژه
          </h2>
          <p className="text-brand-medium-blue mb-6 whitespace-pre-wrap">
            {project.description}
          </p>

          {/* Files */}
          {project.files && project.files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-brand-dark-blue mb-3">
                فایل‌های ضمیمه
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.files.map((file) => (
                  <a
                    key={file.id}
                    href={getFileUrl(file.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-3 border border-brand-medium-gray rounded-lg hover:bg-brand-light-gray transition-colors"
                  >
                    <DocumentTextIcon className="w-8 h-8 text-brand-medium-blue mb-2" />
                    <span className="text-xs text-brand-medium-blue text-center truncate w-full">
                      {file.fileName || 'فایل'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-brand-medium-gray">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
            پیام‌های دریافتی
          </h2>
          {messages.length === 0 ? (
            <p className="text-brand-medium-blue">هنوز پیامی دریافت نشده است</p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border-b border-brand-medium-gray pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-brand-dark-blue">{message.sender}</span>
                    <span className="text-xs text-brand-medium-blue">
                      {formatDate(message.date)}
                    </span>
                  </div>
                  <p className="text-brand-medium-blue">{message.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proposals Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
            پیشنهادهای دریافتی
          </h2>
          {proposals.length === 0 ? (
            <p className="text-brand-medium-blue">هنوز پیشنهادی دریافت نشده است</p>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="border border-brand-medium-gray rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-brand-dark-blue">{proposal.supplier}</span>
                      <span className="text-sm text-brand-medium-blue mr-2">
                        (امتیاز: {proposal.rating})
                      </span>
                    </div>
                    <span className="text-lg font-bold text-brand-dark-blue">
                      {parseInt(proposal.price).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <p className="text-brand-medium-blue">{proposal.message}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="primary" size="sm">
                      مشاهده جزئیات
                    </Button>
                    <Button variant="neutral" size="sm">
                      ارسال پیام
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

