"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "../lib/api";
import SupplierFilters from "../components/suppliers/SupplierFilters";
import SupplierList from "../components/suppliers/SupplierList";
import Button from "../components/Button";
import { Supplier } from "../types/supplier";
import toast from "react-hot-toast";
import logger from "../utils/logger";

export default function SuppliersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState<"newest" | "rating" | "popular">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch cities and categories for filters
        try {
          const [citiesData, categoriesData] = await Promise.all([
            apiClient.getActiveCities(),
            apiClient.getActiveCategories(),
          ]);
          setCities(Array.isArray(citiesData) ? citiesData : []);
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (error) {
          logger.error("Error fetching filter data", error);
        }

        // Fetch suppliers
        const filters: any = {
          page,
          limit: 20,
        };
        
        if (searchQuery) filters.search = searchQuery;
        if (cityFilter) filters.cityId = cityFilter;
        if (categoryFilter) filters.categoryId = categoryFilter;

        const response = await apiClient.getPublicSuppliers(filters);
        const suppliersList = Array.isArray(response.data) ? response.data : [];
        setSuppliers(suppliersList);
        setTotalPages(Math.ceil((response.total || suppliersList.length) / 20));
        
        // Show info if no suppliers found due to endpoint limitation
        if (suppliersList.length === 0 && !searchQuery && !cityFilter && !categoryFilter) {
          logger.info("No suppliers returned - endpoint may require authentication");
        }
      } catch (error: unknown) {
        logger.error("Error fetching suppliers", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت لیست تولیدکننده‌ها";
        toast.error(errorMessage);
        setSuppliers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page, searchQuery, cityFilter, categoryFilter]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    // Update URL
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    if (cityFilter) params.set("city", cityFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    router.push(`/suppliers?${params.toString()}`);
  };

  const handleCityFilter = (cityId: string) => {
    setCityFilter(cityId);
    setPage(1);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (cityId) params.set("city", cityId);
    if (categoryFilter) params.set("category", categoryFilter);
    router.push(`/suppliers?${params.toString()}`);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setCategoryFilter(categoryId);
    setPage(1);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (cityFilter) params.set("city", cityFilter);
    if (categoryId) params.set("category", categoryId);
    router.push(`/suppliers?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            لیست تولیدکننده‌ها
          </h1>
          <p className="text-brand-medium-blue">
            جستجو و انتخاب تولیدکننده مناسب برای پروژه شما
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <SupplierFilters
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            cityFilter={cityFilter}
            onCityFilterChange={handleCityFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={handleCategoryFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            cities={cities}
            categories={categories}
          />
        </div>

        {/* Suppliers List */}
        {(searchQuery || cityFilter || categoryFilter) && suppliers.length === 0 && !isLoading && (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center mb-6">
            <p className="text-brand-medium-blue mb-4">
              تولیدکننده‌ای با این فیلترها یافت نشد
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                setCityFilter("");
                setCategoryFilter("");
                router.push("/suppliers");
              }}
            >
              پاک کردن فیلترها
            </Button>
          </div>
        )}

        <SupplierList
          suppliers={suppliers}
          viewMode={viewMode}
          isLoading={isLoading}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

