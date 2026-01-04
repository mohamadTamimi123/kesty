"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import apiClient from "../../../lib/api";
import { User } from "../../../types/user";
import { Project } from "../../../types/project";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  UserIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShareIcon,
  LinkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ProjectCard from "../../../components/ProjectCard";

interface CustomerProfile extends User {
  fullName?: string;
  company?: string;
  workshopName?: string;
  address?: string;
  city?: string | { id: string; title: string };
  bio?: string;
  birthDate?: string;
  dateOfBirth?: string;
  profileImageUrl?: string;
  avatarUrl?: string;
  projects?: Project[];
}

export default function PublicCustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getPublicCustomerById(customerId);
        setCustomer(data);

        // Fetch customer's public projects if available
        if (data.id) {
          setIsLoadingProjects(true);
          try {
            const projectsData = await apiClient.getPublicProjects(1, 100);
            const projectsList = Array.isArray(projectsData)
              ? projectsData
              : projectsData?.data || [];
            // Filter projects by customer ID
            const customerProjects = projectsList.filter(
              (project: Project) => project.customerId === data.id
            );
            setProjects(customerProjects.slice(0, 6)); // Show max 6 projects
          } catch (error) {
            logger.error("Error fetching projects", error);
            // Don't show error toast, just log it
          } finally {
            setIsLoadingProjects(false);
          }
        }
      } catch (error: unknown) {
        logger.error("Error fetching customer", error);
        const errorMessage =
          (error as any)?.response?.data?.message ||
          "خطا در دریافت اطلاعات مشتری";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const getImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const apiUrl =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3000", ":3001")
        : "http://localhost:3001";
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${apiUrl}/api${path}`;
  };

  const getCityName = (city: any): string => {
    if (!city) return "";
    return typeof city === "object" && city !== null ? city.title || "" : city || "";
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("لینک کپی شد");
    }).catch(() => {
      toast.error("خطا در کپی لینک");
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: customer?.fullName || customer?.name || "پروفایل مشتری",
          text: `پروفایل ${customer?.fullName || customer?.name} در کیستی`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-medium-blue mb-4">مشتری یافت نشد</p>
          <button
            onClick={() => router.back()}
            className="text-brand-medium-blue hover:text-brand-dark-blue"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl(customer.profileImageUrl || customer.avatarUrl);
  const customerName = customer.fullName || customer.name || "";
  const companyName = customer.company || customer.workshopName || "";

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-brand-medium-blue">
          <Link href="/" className="hover:text-brand-dark-blue transition-colors">
            خانه
          </Link>
          <span>/</span>
          <span className="text-brand-dark-blue font-medium">
            پروفایل مشتری
          </span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg border border-brand-medium-gray p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-brand-light-sky flex items-center justify-center">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={customerName}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ) : (
                <UserIcon className="w-16 h-16 text-brand-medium-blue" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-brand-dark-blue font-display">
                  {customerName}
                </h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg hover:bg-brand-light-sky transition-colors"
                    title="اشتراک‌گذاری"
                    aria-label="اشتراک‌گذاری"
                  >
                    <ShareIcon className="w-5 h-5 text-brand-medium-blue" />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg hover:bg-brand-light-sky transition-colors"
                    title="کپی لینک"
                    aria-label="کپی لینک"
                  >
                    <LinkIcon className="w-5 h-5 text-brand-medium-blue" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-brand-medium-blue mt-4">
                {customer.city && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{getCityName(customer.city)}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <DevicePhoneMobileIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{customer.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Company/Organization */}
            {companyName && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <h2 className="text-xl font-bold text-brand-dark-blue mb-4 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-6 h-6" />
                  شرکت / سازمان
                </h2>
                <p className="text-brand-medium-blue">{companyName}</p>
              </div>
            )}

            {/* About */}
            {customer.bio && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <h2 className="text-xl font-bold text-brand-dark-blue mb-4">
                  درباره من
                </h2>
                <p className="text-brand-medium-blue whitespace-pre-line leading-relaxed">
                  {customer.bio}
                </p>
              </div>
            )}

            {/* Address */}
            {customer.address && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <h2 className="text-xl font-bold text-brand-dark-blue mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-6 h-6" />
                  آدرس
                </h2>
                <p className="text-brand-medium-blue">{customer.address}</p>
              </div>
            )}

            {/* Birth Date */}
            {(customer.birthDate || customer.dateOfBirth) && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <h2 className="text-xl font-bold text-brand-dark-blue mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6" />
                  تاریخ تولد
                </h2>
                <p className="text-brand-medium-blue">
                  {customer.birthDate || customer.dateOfBirth}
                </p>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-brand-dark-blue flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6" />
                    پروژه‌ها ({projects.length})
                  </h2>
                  {projects.length >= 6 && (
                    <Link
                      href={`/public/projects?customerId=${customer.id}`}
                      className="text-sm text-brand-medium-blue hover:text-brand-dark-blue"
                    >
                      مشاهده همه →
                    </Link>
                  )}
                </div>
                {isLoadingProjects ? (
                  <div className="text-center py-8 text-brand-medium-blue">
                    در حال بارگذاری پروژه‌ها...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-xl font-bold text-brand-dark-blue mb-4">
                آمار
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-brand-light-gray last:border-0">
                  <span className="text-brand-medium-blue">پروژه‌ها:</span>
                  <span className="font-bold text-brand-dark-blue text-lg">
                    {projects.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

