"use client";

import { useState } from "react";
import { MachineListingFilters, ListingType, MachineCondition } from "../types/machine-listing";
import { Category } from "../types/category";
import { City } from "../types/city";
import { Machine } from "../types/machine";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface MachineFiltersProps {
  filters: MachineListingFilters;
  onFiltersChange: (filters: MachineListingFilters) => void;
  categories: Category[];
  cities: City[];
  machines: Machine[];
}

export default function MachineFilters({
  filters,
  onFiltersChange,
  categories,
  cities,
  machines,
}: MachineFiltersProps) {
  const updateFilter = (key: keyof MachineListingFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
      <h3 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
        فیلترها
      </h3>
      <div className="space-y-4">
        {/* City Filter */}
        <div>
          <label className="block text-sm font-medium text-brand-dark-blue mb-2">
            شهر
          </label>
          <div className="relative">
            <select
              value={filters.cityId || ""}
              onChange={(e) => updateFilter("cityId", e.target.value)}
              className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue appearance-none bg-white"
            >
              <option value="">همه شهرها</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.title}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray pointer-events-none" />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-brand-dark-blue mb-2">
            دسته اصلی
          </label>
          <div className="relative">
            <select
              value={filters.categoryId || ""}
              onChange={(e) => updateFilter("categoryId", e.target.value)}
              className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue appearance-none bg-white"
            >
              <option value="">همه دسته‌ها</option>
              {categories
                .filter((cat) => !cat.parentId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray pointer-events-none" />
          </div>
        </div>

        {/* Listing Type Filter */}
        <div>
          <label className="block text-sm font-medium text-brand-dark-blue mb-2">
            نوع آگهی
          </label>
          <div className="relative">
            <select
              value={filters.listingType || ""}
              onChange={(e) => updateFilter("listingType", e.target.value)}
              className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue appearance-none bg-white"
            >
              <option value="">همه</option>
              <option value={ListingType.FOR_SALE}>فروش</option>
              <option value={ListingType.FOR_RENT}>اجاره</option>
            </select>
            <ChevronDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray pointer-events-none" />
          </div>
        </div>

        {/* Condition Filter */}
        <div>
          <label className="block text-sm font-medium text-brand-dark-blue mb-2">
            وضعیت
          </label>
          <div className="relative">
            <select
              value={filters.condition || ""}
              onChange={(e) => updateFilter("condition", e.target.value)}
              className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue appearance-none bg-white"
            >
              <option value="">همه</option>
              <option value={MachineCondition.NEW}>نو</option>
              <option value={MachineCondition.USED}>کارکرده</option>
            </select>
            <ChevronDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray pointer-events-none" />
          </div>
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-brand-dark-blue mb-2">
              حداقل قیمت
            </label>
            <input
              type="number"
              value={filters.minPrice || ""}
              onChange={(e) =>
                updateFilter("minPrice", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder="0"
              className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-dark-blue mb-2">
              حداکثر قیمت
            </label>
            <input
              type="number"
              value={filters.maxPrice || ""}
              onChange={(e) =>
                updateFilter("maxPrice", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder="نامحدود"
              className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => onFiltersChange({})}
          className="w-full px-4 py-2 bg-brand-light-gray text-brand-dark-blue rounded-lg hover:bg-brand-medium-gray transition-colors"
        >
          پاک کردن فیلترها
        </button>
      </div>
    </div>
  );
}

