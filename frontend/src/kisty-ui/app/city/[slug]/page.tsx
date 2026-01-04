"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb, { BreadcrumbItem } from "../../components/Breadcrumb";
import CategoryCard from "../../components/CategoryCard";
import SupplierCard from "../../components/SupplierCard";
import { City } from "../../types/city";
import { Category } from "../../types/category";
import { Supplier } from "../../types/supplier";
import apiClient from "../../lib/api";
import toast from "react-hot-toast";
import logger from "../../utils/logger";

export default function CityHubPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [city, setCity] = useState<City | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredSuppliers, setFeaturedSuppliers] = useState<Supplier[]>([]);
  const [latestSuppliers, setLatestSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<{ workshops: number; projects: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [cityData, rootCategories, statsData, topSuppliersData, latestSuppliersData] = await Promise.all([
          apiClient.getCityBySlug(slug),
          apiClient.getActiveCategories().then((cats: Category[]) => cats.filter((c: Category) => !c.parentId).slice(0, 5)),
          apiClient.getCityStats(slug).catch(() => ({ workshops: 0, projects: 0 })),
          apiClient.getCityTopSuppliers(slug, 5).catch(() => []),
          apiClient.getCityLatestSuppliers(slug, 5).catch(() => []),
        ]);
        setCity(cityData);
        setCategories(rootCategories);
        setStats(statsData);
        setFeaturedSuppliers(topSuppliersData);
        setLatestSuppliers(latestSuppliersData);
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

  const getLogoUrl = (logoUrl: string | null) => {
    if (!logoUrl) return null;
    if (logoUrl.startsWith('http')) return logoUrl;
    const apiUrl = typeof window !== 'undefined' 
      ? window.location.origin.replace(':3000', ':3001')
      : 'http://localhost:3001';
    const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
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

  if (!city) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-dark-blue">
            شهر یافت نشد
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "خانه", href: "/" },
    { label: "شهرها", href: "/cities" },
    { label: city.title },
  ];

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-brand-medium-gray">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {city.logoUrl && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-brand-light-gray flex-shrink-0">
                <Image
                  src={getLogoUrl(city.logoUrl) || '/placeholder-city.png'}
                  alt={city.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-brand-dark-blue mb-4 font-display">
                {city.title}
              </h1>
              {city.description && (
                <p className="text-lg text-brand-medium-blue leading-relaxed">
                  {city.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Section */}
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
              <div className="text-sm text-brand-medium-blue">پروژه</div>
            </div>
          </div>
        )}

        {/* Main Industries Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
            صنایع اصلی در {city.title}
          </h2>
          <div className="overflow-x-auto pb-4 md:overflow-x-visible">
            <div className="flex gap-6 min-w-max md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:min-w-0">
              {categories.map((category) => (
                <div key={category.id} className="w-64 md:w-auto">
                  <CategoryCard category={category} citySlug={city.slug} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Suppliers Section */}
        {featuredSuppliers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
              پیشنهاد ویژه
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSuppliers.map((supplier) => (
                <Link key={supplier.id} href={`/supplier/${supplier.id}`}>
                  <SupplierCard
                    name={supplier.fullName || supplier.workshopName || "نامشخص"}
                    logoUrl={supplier.profileImageUrl || supplier.coverImageUrl}
                    city={city.title}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest Workshops Section */}
        {latestSuppliers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
              جدیدترین کارگاه‌ها
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestSuppliers.map((supplier) => (
                <Link key={supplier.id} href={`/supplier/${supplier.id}`}>
                  <SupplierCard
                    name={supplier.fullName || supplier.workshopName || "نامشخص"}
                    logoUrl={supplier.profileImageUrl || supplier.coverImageUrl}
                    city={city.title}
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

