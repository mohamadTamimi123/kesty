"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CategoryCard from "./components/CategoryCard";
import CityCard from "./components/CityCard";
import { Category } from "./types/category";
import { City } from "./types/city";
import apiClient from "./lib/api";
import toast from "react-hot-toast";
import { ChevronDownIcon, PlayIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [categoriesData, citiesData] = await Promise.all([
          apiClient.getActiveCategories(),
          apiClient.getActiveCities(),
        ]);
        // Get top 5 main categories (parent categories)
        const mainCategories = categoriesData
          .filter((cat: Category) => !cat.parentId)
          .slice(0, 5);
        setCategories(mainCategories);
        // Get top 15 cities
        setCities(citiesData.slice(0, 15));
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("خطا در دریافت اطلاعات");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    if (selectedCity && selectedCategory) {
      router.push(`/city/${selectedCity}/category/${selectedCategory}`);
    } else if (selectedCity) {
      router.push(`/city/${selectedCity}`);
    } else if (selectedCategory) {
      router.push(`/category/${selectedCategory}`);
    } else {
      toast.error("لطفاً شهر یا تخصص را انتخاب کنید");
    }
  };

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col">
      {/* First Body Section - Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark-blue via-brand-medium-blue to-brand-dark-blue text-white py-20 px-4 sm:px-6 lg:px-8">
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
        </div>

        {/* Hero Image Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-light-sky/30 via-transparent to-brand-medium-blue/20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="text-center lg:text-right animate-fade-in">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 font-display leading-tight">
                شبکه تخصصی تولید و ساخت قطعات سفارشی
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl mb-8 text-brand-light-sky leading-relaxed">
                اتصال مستقیم مهندسین و کارفرمایان به بهترین کارگاه‌های ساخت و تولید در سراسر ایران
              </p>
              
              {/* Hero Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8 animate-slide-in">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">+500</div>
                  <div className="text-sm text-brand-light-sky">کارگاه فعال</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">+1000</div>
                  <div className="text-sm text-brand-light-sky">پروژه موفق</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">+50</div>
                  <div className="text-sm text-brand-light-sky">شهر فعال</div>
                </div>
              </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="relative animate-scale-in">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-square bg-gradient-to-br from-brand-light-sky/40 via-brand-medium-blue/30 to-brand-dark-blue/40 backdrop-blur-sm">
                  {/* Hero Image Placeholder - You can replace this with an actual image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30 shadow-lg">
                        <Image
                          src="/keesti logo.png"
                          alt="کیستی"
                          width={80}
                          height={80}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2 font-display">کیستی</h3>
                      <p className="text-brand-light-sky">پلتفرم تخصصی تولید و ساخت</p>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-pulse-slow"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="mt-12 bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto animate-scale-in border border-brand-light-gray">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* City Dropdown */}
              <div className="flex-1 relative">
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  انتخاب شهر
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-brand-medium-gray rounded-lg text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue appearance-none bg-white transition-all hover:border-brand-medium-blue"
                  >
                    <option value="">همه شهرها</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.slug}>
                        {city.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray pointer-events-none" />
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="flex-1 relative">
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  انتخاب تخصص
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-brand-medium-gray rounded-lg text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue appearance-none bg-white transition-all hover:border-brand-medium-blue"
                  >
                    <option value="">همه تخصص‌ها</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray pointer-events-none" />
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSearch}
                className="flex-1 px-8 py-4 rounded-lg bg-brand-medium-blue text-white font-bold text-lg hover:bg-brand-dark-blue transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                جستجو
              </button>
              <Link
                href="/register?role=supplier"
                className="flex-1 px-8 py-4 rounded-lg bg-green-600 text-white font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-center"
              >
                ثبت نام به عنوان تولیدکننده
              </Link>
              <Link
                href="/register?role=customer"
                className="flex-1 px-8 py-4 rounded-lg border-2 border-brand-medium-blue text-brand-medium-blue font-bold text-lg hover:bg-brand-medium-blue hover:text-white transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-center"
              >
                درخواست ساخت قطعه
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Second Body Section - Main Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-brand-off-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-brand-dark-blue font-display">
            صنایع قطعه‌سازی
          </h2>
          {isLoading ? (
            <div className="text-center text-brand-medium-blue py-12">
              در حال بارگذاری...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Third Body Section - Video and Request */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-brand-off-white animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Section */}
            <div className="relative bg-gradient-to-br from-brand-dark-blue via-brand-medium-blue to-brand-dark-blue rounded-xl overflow-hidden shadow-2xl aspect-video animate-scale-in">
              {/* Background Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-pulse-slow"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all group backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl hover:scale-110">
                  <PlayIcon className="w-10 h-10 text-white mr-1 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-sm bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="font-medium">ویدیو معرفی پلتفرم</span>
                <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-all hover:scale-110">
                  🔊
                </button>
              </div>
            </div>

            {/* Request Section */}
            <div className="relative bg-gradient-to-br from-brand-medium-blue via-brand-dark-blue to-brand-medium-blue rounded-xl p-8 md:p-12 shadow-2xl flex flex-col justify-center animate-slide-in overflow-hidden">
              {/* Background Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-light-sky/10 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">
                  درخواست ساخت قطعه
                </h3>
                <p className="text-brand-light-sky text-lg mb-8 leading-relaxed">
                  نیاز به ساخت قطعه سفارشی دارید؟ با ثبت درخواست، بهترین کارگاه‌های تولیدی
                  در سراسر ایران به شما پیشنهاد می‌دهند.
                </p>
                <Link
                  href="/register?role=customer"
                  className="inline-block px-8 py-4 bg-white text-brand-medium-blue font-bold text-lg rounded-lg hover:bg-brand-light-sky transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-center"
                >
                  ثبت درخواست جدید
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fourth Body Section - Cities */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-brand-off-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMzNiNmUiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-brand-dark-blue font-display">
              شهرهای فعال
            </h2>
            <p className="text-brand-medium-blue text-lg">
              دسترسی به بهترین کارگاه‌های تولیدی در سراسر ایران
            </p>
          </div>
          
          {isLoading ? (
            <div className="text-center text-brand-medium-blue py-12 animate-pulse-slow">
              در حال بارگذاری...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cities.map((city, index) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-auto bg-gradient-to-br from-brand-dark-blue via-brand-medium-blue to-brand-dark-blue text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-light-sky/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-medium-blue/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-light-sky/5 rounded-full blur-2xl"></div>
        
        <div className="relative max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand & Contact Info */}
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <div className="mb-4">
                <h3 className="text-2xl font-bold mb-4 font-display text-brand-light-sky">کیستی</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  شبکه تخصصی تولید و ساخت قطعات سفارشی
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-brand-light-sky mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:support@keesti.com" className="text-gray-300 hover:text-brand-light-sky transition-colors">
                    support@keesti.com
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-brand-light-sky mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-300">021-12345678</span>
                </div>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-bold mb-6 font-display text-brand-light-sky">آمار پلتفرم</h3>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-3xl font-bold text-white mb-1">+500</div>
                  <div className="text-sm text-gray-300">کارگاه فعال</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-3xl font-bold text-white mb-1">+1000</div>
                  <div className="text-sm text-gray-300">پروژه موفق</div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-gray-300 text-sm">میانگین امتیاز:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-yellow-400 text-lg hover:scale-110 transition-transform cursor-default">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Categories */}
            <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-bold mb-6 font-display text-brand-light-sky">تخصص‌های کلیدی</h3>
              <div className="space-y-2">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="block px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all duration-300 hover:translate-x-[-4px] border border-white/10 hover:border-brand-light-sky/30 group"
                  >
                    <span className="text-gray-300 group-hover:text-brand-light-sky transition-colors">
                      {category.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-xl font-bold mb-6 font-display text-brand-light-sky">دسترسی سریع</h3>
              <div className="space-y-3">
                <Link
                  href="/about"
                  className="flex items-center gap-3 text-gray-300 hover:text-brand-light-sky transition-all duration-300 hover:translate-x-[-4px] group"
                >
                  <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>درباره ما</span>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 text-gray-300 hover:text-brand-light-sky transition-all duration-300 hover:translate-x-[-4px] group"
                >
                  <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>تماس با ما</span>
                </Link>
                <a
                  href="https://linkedin.com/company/keesti"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-brand-light-sky transition-all duration-300 hover:translate-x-[-4px] group"
                >
                  <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
                <Link
                  href="/brandbook"
                  className="flex items-center gap-3 text-gray-300 hover:text-brand-light-sky transition-all duration-300 hover:translate-x-[-4px] group"
                >
                  <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>برندبوک</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-white/20 pt-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-300 text-sm">
                © {new Date().getFullYear()} کیستی. تمام حقوق محفوظ است.
              </p>
              <div className="flex items-center gap-6">
                <Link href="/faq" className="text-gray-300 hover:text-brand-light-sky text-sm transition-colors">
                  سوالات متداول
                </Link>
                <Link href="/changelog" className="text-gray-300 hover:text-brand-light-sky text-sm transition-colors">
                  تغییرات
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
