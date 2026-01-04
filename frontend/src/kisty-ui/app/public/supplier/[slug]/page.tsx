"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "../../../lib/api";
import { User } from "../../../types/user";
import { Category } from "../../../types/category";
import { Project } from "../../../types/project";
import SupplierProfileHeader from "../../../components/suppliers/SupplierProfileHeader";
import SupplierProfileSidebar from "../../../components/suppliers/SupplierProfileSidebar";
import SupplierProfileContent from "../../../components/suppliers/SupplierProfileContent";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";

interface SupplierProfile extends User {
  categories?: Category[];
  portfolios?: any[];
  reviews?: any[];
  slug?: string;
}

export default function PublicSupplierProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setIsLoading(true);
        
        // Check if slug is a UUID (ID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        
        let data;
        if (isUUID) {
          // If it's a UUID, try to get supplier by ID
          data = await apiClient.getPublicSupplierById(slug);
        } else {
          // Use slug normally
          data = await apiClient.getSupplierBySlug(slug);
        }
        
        setSupplier(data);
        
        // Fetch projects related to supplier's categories
        if (data.id) {
          setIsLoadingProjects(true);
          try {
            const projectsData = await apiClient.getSupplierProjects(data.id);
            const projectsList = Array.isArray(projectsData.data) ? projectsData.data : [];
            // Filter projects by supplier's categories
            if (data.categories && data.categories.length > 0) {
              const categoryIds = data.categories.map(cat => cat.id);
              const filteredProjects = projectsList.filter((project: Project) => 
                categoryIds.includes(project.categoryId)
              );
              setProjects(filteredProjects.slice(0, 6)); // Show max 6 projects
            } else {
              setProjects(projectsList.slice(0, 6));
            }
          } catch (error) {
            logger.error("Error fetching projects", error);
            // Don't show error toast, just log it
          } finally {
            setIsLoadingProjects(false);
          }
        }
      } catch (error: unknown) {
        logger.error("Error fetching supplier", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت اطلاعات تولیدکننده";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchSupplier();
    }
  }, [slug]);

  const handleSendMessage = async () => {
    if (!supplier) return;
    
    try {
      const conversation = await apiClient.createConversation(supplier.id);
      router.push(`/messaging/${conversation.id}`);
    } catch (error: unknown) {
      logger.error("Error creating conversation", error);
      toast.error("خطا در ایجاد مکالمه");
    }
  };

  const calculateAverageRating = () => {
    if (!supplier?.reviews || supplier.reviews.length === 0) return "0";
    const sum = supplier.reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    return (sum / supplier.reviews.length).toFixed(1);
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
          title: supplier?.workshopName || supplier?.fullName || "پروفایل تولیدکننده",
          text: `پروفایل ${supplier?.workshopName || supplier?.fullName} در کیستی`,
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
        <div className="text-brand-medium-blue">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-medium-blue mb-4">تولیدکننده یافت نشد</p>
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

  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-brand-medium-blue">
          <Link href="/" className="hover:text-brand-dark-blue transition-colors">
            خانه
          </Link>
          <span>/</span>
          <Link href="/suppliers" className="hover:text-brand-dark-blue transition-colors">
            تولیدکننده‌ها
          </Link>
          <span>/</span>
          <span className="text-brand-dark-blue font-medium">
            {supplier.workshopName || supplier.fullName}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <SupplierProfileHeader
            supplier={supplier}
            averageRating={averageRating}
            onShare={handleShare}
            onCopyLink={handleCopyLink}
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <SupplierProfileContent
              supplier={supplier}
              projects={projects}
              isLoadingProjects={isLoadingProjects}
            />
          </div>

          <div>
            <SupplierProfileSidebar
              supplier={supplier}
              projects={projects}
              averageRating={averageRating}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

