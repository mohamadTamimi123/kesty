"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb, { BreadcrumbItem } from "../../../../components/Breadcrumb";
import SupplierCard from "../../../../components/SupplierCard";
import { City } from "../../../../types/city";
import { Category } from "../../../../types/category";
import { Supplier } from "../../../../types/supplier";
import { EducationalArticle } from "../../../../types/article";
import apiClient from "../../../../lib/api";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import { FunnelIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export default function CityCategoryCombinedPage() {
  const params = useParams();
  const citySlug = params.slug as string;
  const categorySlug = params.categorySlug as string;
  const [city, setCity] = useState<City | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<EducationalArticle[]>([]);
  const [stats, setStats] = useState<{ workshops: number; projects: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    subcategory?: string;
    minRating?: number;
    equipment?: string[];
    establishedYear?: number;
  }>({});

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        cityData,
        categoryData,
        suppliersData,
        subcategoriesData,
        statsData,
        articlesData,
      ] = await Promise.all([
        apiClient.getCityBySlug(citySlug),
        apiClient.getCategoryBySlug(categorySlug),
        apiClient.getCityCategorySuppliers(citySlug, categorySlug, filters).catch(() => []),
        apiClient.getCategorySubcategories(categorySlug).catch(() => []),
        apiClient.getCityCategoryStats(citySlug, categorySlug).catch(() => ({ workshops: 0, projects: 0 })),
        apiClient.getCategoryArticles(categorySlug, 3).catch(() => []),
      ]);
      setCity(cityData);
      setCategory(categoryData);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setSubcategories(Array.isArray(subcategoriesData) ? subcategoriesData : []);
      setStats(statsData);
      setArticles(Array.isArray(articlesData) ? articlesData : []);
    } catch (error: any) {
      logger.error("Error fetching data", error);
      toast.error(error.response?.data?.message || "خطا در دریافت اطلاعات");
    } finally {
      setIsLoading(false);
    }
  }, [citySlug, categorySlug, filters]);

  useEffect(() => {
    if (citySlug && categorySlug) {
      fetchData();
    }
  }, [citySlug, categorySlug, fetchData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-medium-blue">
            در حال بارگذاری...
          </div>
        </div>
      </div>
    );
  }

  if (!city || !category) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-dark-blue">
            اطلاعات یافت نشد
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "خانه", href: "/" },
    { label: "شهرها", href: "/cities" },
    { label: city.title, href: `/city/${city.slug}` },
    { label: category.title },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue mb-2 font-display">
            {category.title} در {city.title}
          </h1>
          <p className="text-brand-medium-blue">
            لیست تولیدکنندگان {category.title} در شهر {city.title}
          </p>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="text-3xl font-bold text-brand-dark-blue mb-1">
                {stats.workshops}
              </div>
              <div className="text-sm text-brand-medium-blue">کارگاه فعال</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="text-3xl font-bold text-brand-dark-blue mb-1">
                {stats.projects}
              </div>
              <div className="text-sm text-brand-medium-blue">پروژه تکمیل شده</div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-brand-medium-gray">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full text-brand-dark-blue font-medium mb-4"
          >
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5" />
              <span>فیلترها</span>
            </div>
            {showFilters ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-brand-medium-gray">
              {subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    زیرشاخه
                  </label>
                  <select
                    value={filters.subcategory || ""}
                    onChange={(e) => handleFilterChange("subcategory", e.target.value || undefined)}
                    className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue"
                  >
                    <option value="">همه</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.slug}>
                        {sub.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  حداقل امتیاز
                </label>
                <select
                  value={filters.minRating || ""}
                  onChange={(e) => handleFilterChange("minRating", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue"
                >
                  <option value="">همه</option>
                  <option value="4">4+</option>
                  <option value="4.5">4.5+</option>
                  <option value="4.8">4.8+</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Suppliers List */}
        <section>
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
            تولیدکنندگان
          </h2>
          {suppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <Link key={supplier.id} href={`/supplier/${supplier.id}`}>
                  <SupplierCard
                    name={supplier.fullName || supplier.workshopName || "نامشخص"}
                    logoUrl={supplier.profileImageUrl || supplier.coverImageUrl}
                    city={city.title}
                    category={category.title}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center border border-brand-medium-gray">
              <p className="text-brand-medium-blue">
                تولیدکننده‌ای یافت نشد
              </p>
            </div>
          )}
        </section>

        {/* Related Articles Section */}
        {articles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
              مقالات مرتبط
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/education/${article.slug}`}
                  className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-all"
                >
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-brand-medium-blue line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

