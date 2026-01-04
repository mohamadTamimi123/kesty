"use client";

import { useState } from "react";
import Input from "../Input";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

interface SupplierFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  cityFilter: string;
  onCityFilterChange: (cityId: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (categoryId: string) => void;
  sortBy: "newest" | "rating" | "popular";
  onSortChange: (sort: "newest" | "rating" | "popular") => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  cities: Array<{ id: string; title: string }>;
  categories: Array<{ id: string; title: string }>;
}

export default function SupplierFilters({
  searchQuery,
  onSearchChange,
  cityFilter,
  onCityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  cities,
  categories,
}: SupplierFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
      <div className="space-y-4">
        {/* Search and View Mode */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="جستجو بر اساس نام کارگاه..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              icon={<MagnifyingGlassIcon className="w-5 h-5" />}
              iconPosition="start"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border border-brand-medium-gray rounded-lg p-1">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-brand-medium-blue text-white"
                  : "text-brand-medium-blue hover:bg-brand-light-sky"
              }`}
              aria-label="نمایش شبکه‌ای"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-brand-medium-blue text-white"
                  : "text-brand-medium-blue hover:bg-brand-light-sky"
              }`}
              aria-label="نمایش لیستی"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? "bg-brand-medium-blue text-white"
                : "bg-brand-light-sky text-brand-medium-blue hover:bg-brand-medium-gray"
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span className="text-sm font-medium">فیلترها</span>
          </button>

          {showFilters && (
            <div className="flex flex-wrap gap-4 w-full pt-4 border-t border-brand-medium-gray">
              <select
                value={cityFilter}
                onChange={(e) => onCityFilterChange(e.target.value)}
                className="px-4 py-2 border border-brand-medium-gray rounded-lg text-sm text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue bg-white"
              >
                <option value="">همه شهرها</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.title}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="px-4 py-2 border border-brand-medium-gray rounded-lg text-sm text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue bg-white"
              >
                <option value="">همه دسته‌بندی‌ها</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="px-4 py-2 border border-brand-medium-gray rounded-lg text-sm text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue bg-white"
              >
                <option value="newest">جدیدترین</option>
                <option value="rating">بالاترین امتیاز</option>
                <option value="popular">محبوب‌ترین</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

