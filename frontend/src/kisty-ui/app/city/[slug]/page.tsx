"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Breadcrumb, { BreadcrumbItem } from "../../components/Breadcrumb";
import CategoryCard from "../../components/CategoryCard";
import SupplierCard from "../../components/SupplierCard";
import { City } from "../../types/city";
import { Category } from "../../types/category";
import apiClient from "../../lib/api";
import toast from "react-hot-toast";

export default function CityHubPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [city, setCity] = useState<City | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [cityData, categoriesData] = await Promise.all([
          apiClient.getCityBySlug(slug),
          apiClient.getActiveCategories(),
        ]);
        setCity(cityData);
        // Get top 5 categories
        setCategories(categoriesData.slice(0, 5));
      } catch (error: any) {
        console.error("Error fetching data:", error);
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
    { label: "شهرها", href: "/cities" },
    { label: city.title },
  ];

  // Mock suppliers data - will be replaced with real API call later
  const featuredSuppliers = [
    { name: "کارگاه نمونه 1", rating: 4.5, establishedYear: 2015, city: city.title },
    { name: "کارگاه نمونه 2", rating: 4.8, establishedYear: 2018, city: city.title },
    { name: "کارگاه نمونه 3", rating: 4.2, establishedYear: 2020, city: city.title },
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

        {/* Main Industries Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
            صنایع اصلی در {city.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} citySlug={city.slug} />
            ))}
          </div>
        </section>

        {/* Featured Suppliers Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
            پیشنهاد ویژه
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSuppliers.map((supplier, index) => (
              <SupplierCard key={index} {...supplier} />
            ))}
          </div>
        </section>

        {/* Latest Workshops Section */}
        <section>
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
            جدیدترین کارگاه‌ها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSuppliers.map((supplier, index) => (
              <SupplierCard key={`latest-${index}`} {...supplier} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

