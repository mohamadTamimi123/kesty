"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../components/Button";
import { Project, ProjectStatus } from "../../../types/project";
import { Quote } from "../../../types/quote";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  MapPinIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import SupplierProjectCard from "../../../components/SupplierProjectCard";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function SupplierProjectsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supplierCategories, setSupplierCategories] = useState<string[]>([]);
  const [supplierCities, setSupplierCities] = useState<string[]>([]);
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);
  const userIdRef = useRef(user?.id);

  // Update ref when user.id changes
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      userIdRef.current = user?.id;
      hasFetchedRef.current = false; // Reset fetch flag when user changes
    }
  }, [user?.id]);

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (hasFetchedRef.current || fetchingRef.current) {
      return;
    }

    // Only show loading if we don't have data yet
    if (projects.length === 0) {
      setIsLoading(true);
    }
    fetchingRef.current = true;

    try {
      // Fetch supplier's categories and cities
      let supplierCategoryIds: string[] = [];
      let supplierCityIds: string[] = [];
      
      try {
        const [categoriesData, citiesData] = await Promise.all([
          apiClient.getSupplierCategories(user.id),
          apiClient.getSupplierCities(user.id),
        ]);
        
        supplierCategoryIds = Array.isArray(categoriesData) 
          ? categoriesData.map((cat: any) => cat.id || cat)
          : [];
        supplierCityIds = Array.isArray(citiesData)
          ? citiesData.map((city: any) => city.id || city)
          : [];
        
        setSupplierCategories(supplierCategoryIds);
        setSupplierCities(supplierCityIds);
      } catch (error) {
        logger.error("Error fetching supplier categories/cities", error);
        const errorMessage =
          (error as any)?.response?.data?.message || "خطا در دریافت دسته‌بندی‌ها و شهرها";
        toast.error(errorMessage);
      }

      // Fetch public projects and quotes simultaneously
      const [response, quotesData] = await Promise.all([
        apiClient.getPublicProjects(1, 100).catch((error) => {
          logger.error("Error fetching projects", error);
          throw error;
        }),
        apiClient.getMyQuotes().catch((error) => {
          // Log error but don't fail the whole fetch
          logger.error("Error fetching quotes", error);
          return [];
        }),
      ]);

      // Handle both array response and paginated response { data: Project[], ... }
      const allProjects = Array.isArray(response) 
        ? response 
        : (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data))
        ? response.data
        : [];
      
      // Filter projects that match supplier's specialties
      const filteredProjects = allProjects.filter((project: Project) => {
        const matchesCategory = supplierCategoryIds.length === 0 || 
          (project.categoryId && supplierCategoryIds.includes(project.categoryId)) ||
          (project.category?.id && supplierCategoryIds.includes(project.category.id));
        
        const matchesCity = supplierCityIds.length === 0 ||
          (project.cityId && supplierCityIds.includes(project.cityId)) ||
          (project.city?.id && supplierCityIds.includes(project.city.id));
        
        return matchesCategory || matchesCity || (supplierCategoryIds.length === 0 && supplierCityIds.length === 0);
      });
      
      // Sort by creation date (newest first)
      filteredProjects.sort((a: Project, b: Project) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setProjects(filteredProjects);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      hasFetchedRef.current = true;
    } catch (error) {
      logger.error("Error fetching projects", error);
      const errorMessage =
        (error as any)?.response?.data?.message || "خطا در دریافت پروژه‌ها";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [isAuthenticated, user?.id, projects.length]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProjects();
    } else {
      setIsLoading(false);
    }
    // Only depend on isAuthenticated and user.id, not fetchProjects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const hasQuote = (projectId: string): boolean => {
    return quotes.some((quote) => quote.projectId === projectId);
  };

  const getQuote = (projectId: string): Quote | undefined => {
    return quotes.find((quote) => quote.projectId === projectId);
  };

  if (isLoading) {
    return (
      <div className="text-center text-brand-medium-blue py-12">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/supplier"
          className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          بازگشت به داشبورد
        </Link>
        <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
          پروژه‌های مرتبط
        </h1>
        <p className="text-brand-medium-blue">
          درخواست‌های مرتبط با تخصص شما
        </p>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-brand-medium-gray mx-auto mb-4" />
            <p className="text-brand-medium-blue mb-2">
              در حال حاضر پروژه‌ای مرتبط با تخصص شما وجود ندارد
            </p>
            <p className="text-sm text-brand-medium-blue mb-4">
              {supplierCategories.length === 0 && supplierCities.length === 0
                ? "لطفاً دسته‌بندی‌ها و شهرهای کاری خود را در پروفایل تکمیل کنید تا پروژه‌های مرتبط را دریافت کنید."
                : "پروفایل خود را تکمیل کنید تا پروژه‌های بیشتری دریافت کنید"}
            </p>
            {(supplierCategories.length === 0 || supplierCities.length === 0) && (
              <Link href="/dashboard/supplier/profile">
                <Button variant="primary" size="sm">
                  تکمیل پروفایل
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-brand-medium-gray">
            {projects.map((project) => {
              return (
               
                <SupplierProjectCard
                  key={project.id}
                  project={project}
                  quote={getQuote(project.id)}
                  hasExistingQuote={hasQuote(project.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

