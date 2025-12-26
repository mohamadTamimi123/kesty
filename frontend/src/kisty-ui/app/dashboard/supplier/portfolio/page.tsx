"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../../../components/Button";
import PortfolioCard from "../../../components/PortfolioCard";
import { Portfolio } from "../../../types/portfolio";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { PlusCircleIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function SupplierPortfolioPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMyPortfolios();
        setPortfolios(Array.isArray(response) ? response : []);
      } catch (error: any) {
        console.error("Error fetching portfolios:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت نمونه کارها");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPortfolios();
    }
  }, [isAuthenticated]);

  const filteredPortfolios = portfolios.filter((portfolio) =>
    portfolio.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
              نمونه کارها
            </h1>
            <p className="text-brand-medium-blue">
              مدیریت نمونه کارهای شما
            </p>
          </div>
          <Link href="/dashboard/supplier/portfolio/create">
            <Button variant="primary">
              <PlusCircleIcon className="w-5 h-5 ml-2" />
              ثبت نمونه کار جدید
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray" />
            <input
              type="text"
              placeholder="جستجو در نمونه کارها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
            />
          </div>
        </div>

        {filteredPortfolios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue mb-4">
              {searchQuery ? "نتیجه‌ای یافت نشد" : "هنوز نمونه کاری ثبت نکرده‌اید"}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/supplier/portfolio/create">
                <Button variant="primary">
                  <PlusCircleIcon className="w-5 h-5 ml-2" />
                  ثبت اولین نمونه کار
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

