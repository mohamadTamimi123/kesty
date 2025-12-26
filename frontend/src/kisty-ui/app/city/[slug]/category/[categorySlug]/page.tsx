"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Breadcrumb, { BreadcrumbItem } from "../../../../components/Breadcrumb";
import SupplierCard from "../../../../components/SupplierCard";
import { City } from "../../../../types/city";
import { Category } from "../../../../types/category";
import apiClient from "../../../../lib/api";
import toast from "react-hot-toast";
import { FunnelIcon } from "@heroicons/react/24/outline";

export default function CityCategoryCombinedPage() {
  const params = useParams();
  const citySlug = params.slug as string; // Changed from citySlug to slug
  const categorySlug = params.categorySlug as string;
  const [city, setCity] = useState<City | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [cityData, categoryData] = await Promise.all([
          apiClient.getCityBySlug(citySlug),
          apiClient.getCategoryBySlug(categorySlug),
        ]);
        setCity(cityData);
        setCategory(categoryData);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت اطلاعات");
      } finally {
        setIsLoading(false);
      }
    };

    if (citySlug && categorySlug) {
      fetchData();
    }
  }, [citySlug, categorySlug]);

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
    { label: "شهرها", href: "/cities" },
    { label: city.title, href: `/city/${city.slug}` },
    { label: category.title },
  ];

  // Mock suppliers data - will be replaced with real API call later
  const suppliers = [
    { 
      name: "کارگاه نمونه 1", 
      rating: 4.8, 
      establishedYear: 2015, 
      city: city.title,
      category: category.title,
      equipment: ["CNC تراش", "CNC فرز", "پرس"]
    },
    { 
      name: "کارگاه نمونه 2", 
      rating: 4.6, 
      establishedYear: 2018, 
      city: city.title,
      category: category.title,
      equipment: ["CNC تراش", "پرس"]
    },
    { 
      name: "کارگاه نمونه 3", 
      rating: 4.9, 
      establishedYear: 2010, 
      city: city.title,
      category: category.title,
      equipment: ["CNC تراش", "CNC فرز", "پرس", "جوشکاری"]
    },
  ];

  const stats = {
    totalWorkshops: suppliers.length,
    completedProjects: 150,
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.totalWorkshops}
            </div>
            <div className="text-sm text-brand-medium-blue">کارگاه فعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.completedProjects}
            </div>
            <div className="text-sm text-brand-medium-blue">پروژه تکمیل شده</div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-brand-medium-gray">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-brand-dark-blue font-medium mb-4 w-full"
          >
            <FunnelIcon className="w-5 h-5" />
            <span>فیلترها</span>
          </button>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-brand-medium-gray">
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  تجهیزات خاص
                </label>
                <select className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue">
                  <option>همه</option>
                  <option>CNC تراش</option>
                  <option>CNC فرز</option>
                  <option>پرس</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  امتیاز
                </label>
                <select className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue">
                  <option>همه</option>
                  <option>4+</option>
                  <option>4.5+</option>
                  <option>4.8+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  سال تأسیس
                </label>
                <select className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue">
                  <option>همه</option>
                  <option>قبل از 2010</option>
                  <option>2010-2015</option>
                  <option>2015-2020</option>
                  <option>بعد از 2020</option>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier, index) => (
              <SupplierCard key={index} {...supplier} />
            ))}
          </div>
        </section>

        {/* Related Articles Section - Placeholder */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
            مقالات مرتبط
          </h2>
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <p className="text-brand-medium-blue">
              مقالات به زودی اضافه خواهند شد
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

