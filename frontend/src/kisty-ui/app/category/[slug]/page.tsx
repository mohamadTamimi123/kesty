"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb, { BreadcrumbItem } from "../../components/Breadcrumb";
import CityCard from "../../components/CityCard";
import SupplierCard from "../../components/SupplierCard";
import { Category } from "../../types/category";
import { City } from "../../types/city";
import { Supplier } from "../../types/supplier";
import { EducationalArticle } from "../../types/article";
import apiClient from "../../lib/api";
import toast from "react-hot-toast";
import logger from "../../utils/logger";

export default function CategoryHubPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<Supplier[]>([]);
  const [articles, setArticles] = useState<EducationalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          categoryData,
          citiesData,
          subcategoriesData,
          topSuppliersData,
          articlesData,
        ] = await Promise.all([
          apiClient.getCategoryBySlug(slug),
          apiClient.getCategoryCities(slug).catch(() => apiClient.getActiveCities().then(c => c.slice(0, 15))),
          apiClient.getCategorySubcategories(slug).catch(() => []),
          apiClient.getCategoryTopSuppliers(slug, 5).catch(() => []),
          apiClient.getCategoryArticles(slug, 5).catch(() => []),
        ]);
        setCategory(categoryData);
        setCities(Array.isArray(citiesData) ? citiesData.slice(0, 15) : []);
        setSubcategories(Array.isArray(subcategoriesData) ? subcategoriesData : []);
        setTopSuppliers(Array.isArray(topSuppliersData) ? topSuppliersData : []);
        setArticles(Array.isArray(articlesData) ? articlesData : []);
      } catch (error: any) {
        logger.error("Error fetching data", error);
        toast.error(error.response?.data?.message || "خطا در دریافت اطلاعات");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const getIconUrl = (iconUrl: string | null) => {
    if (!iconUrl) return null;
    if (iconUrl.startsWith('http')) return iconUrl;
    const apiUrl = typeof window !== 'undefined' 
      ? window.location.origin.replace(':3000', ':3001')
      : 'http://localhost:3001';
    const path = iconUrl.startsWith('/') ? iconUrl : `/${iconUrl}`;
    return `${apiUrl}/api${path}`;
  };

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

  if (!category) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-dark-blue">
            کتگوری یافت نشد
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "خانه", href: "/" },
    { label: "صنایع", href: "/categories" },
    { label: category.title },
  ];

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-brand-medium-gray">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {category.iconUrl && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-brand-light-gray flex-shrink-0">
                <Image
                  src={getIconUrl(category.iconUrl) || '/placeholder-icon.png'}
                  alt={category.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-brand-dark-blue mb-4 font-display">
                {category.title}
              </h1>
              {category.description && (
                <p className="text-lg text-brand-medium-blue leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cities Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
            {category.title} در شهرهای مختلف
          </h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:min-w-0">
              {cities.map((city) => (
                <div key={city.id} className="w-64 md:w-auto">
                  <CityCard city={city} categorySlug={category.slug} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
              زیرشاخه‌های این صنعت
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={`/category/${subcategory.slug}`}
                  className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray hover:shadow-lg transition-all"
                >
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">
                    {subcategory.title}
                  </h3>
                  {subcategory.description && (
                    <p className="text-sm text-brand-medium-blue line-clamp-2">
                      {subcategory.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Educational Articles Section */}
        {articles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
              مقالات آموزشی مرتبط
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Top Suppliers Section */}
        {topSuppliers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
              تولیدکنندگان برتر در این صنعت
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topSuppliers.map((supplier) => (
                <Link key={supplier.id} href={`/supplier/${supplier.id}`}>
                  <SupplierCard
                    name={supplier.fullName || supplier.workshopName || "نامشخص"}
                    logoUrl={supplier.profileImageUrl || supplier.coverImageUrl}
                    category={category.title}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

