"use client";

import { useState, useEffect } from "react";
import MachineListingCard from "../components/MachineListingCard";
import MachineFilters from "../components/MachineFilters";
import { MachineListing, MachineListingFilters } from "../types/machine-listing";
import { Category } from "../types/category";
import { City } from "../types/city";
import { Machine } from "../types/machine";
import apiClient from "../lib/api";
import toast from "react-hot-toast";
import logger from "../utils/logger";

export default function MachineryMarketPage() {
  const [listings, setListings] = useState<MachineListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filters, setFilters] = useState<MachineListingFilters>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [listingsData, categoriesData, citiesData, machinesData] = await Promise.all([
          apiClient.getMachineListings(filters),
          apiClient.getActiveCategories(),
          apiClient.getActiveCities(),
          apiClient.getMachines(),
        ]);

        setListings(listingsData);
        setCategories(categoriesData);
        setCities(citiesData);
        setMachines(machinesData);
      } catch (error: unknown) {
        logger.error("Error fetching data", error);
        toast.error("خطا در دریافت اطلاعات");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-dark-blue mb-4 font-display">
            بازارگاه ماشین‌آلات
          </h1>
          <p className="text-lg text-brand-medium-blue">
            خرید، فروش و اجاره ماشین‌آلات صنعتی در سراسر ایران
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <MachineFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              cities={cities}
              machines={machines}
            />
          </div>

          {/* Listings */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center text-brand-medium-blue py-12">
                در حال بارگذاری...
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <MachineListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-12 text-center">
                <p className="text-brand-medium-blue">
                  آگهی‌ای با فیلترهای انتخابی یافت نشد
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

