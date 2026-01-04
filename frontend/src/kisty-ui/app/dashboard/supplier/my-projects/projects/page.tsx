"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../../components/Button";
import SupplierProjectCard from "../../../../components/SupplierProjectCard";
import { Project, ProjectStatus } from "../../../../types/project";
import { Quote } from "../../../../types/quote";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";


export default function SupplierProjectsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supplierCategories, setSupplierCategories] = useState<string[]>([]);
  const [supplierCities, setSupplierCities] = useState<string[]>([]);

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setIsLoading(true);
      
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
      }

      // Fetch public projects
      const response = await apiClient.getPublicProjects();
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

      // Fetch quotes to check which projects have quotes
      try {
        const quotesData = await apiClient.getMyQuotes();
        setQuotes(Array.isArray(quotesData) ? quotesData : []);
      } catch (error) {
        logger.error("Error fetching quotes", error);
      }
    } catch (error) {
      logger.error("Error fetching projects", error);
      toast.error("خطا در دریافت پروژه‌ها");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

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
              const quote = getQuote(project.id);
              const hasExistingQuote = hasQuote(project.id);
              
              return (
                <>
                asd
                </>
                // <SupplierProjectCard
                //   key={project.id}
                //   project={project}
                //   quote={quote}
                //   hasExistingQuote={hasExistingQuote}
                // />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

