"use client";

import Link from "next/link";
import SupplierCard from "../SupplierCard";
import Button from "../Button";
import { Supplier } from "../../types/supplier";

interface SupplierListProps {
  suppliers: Supplier[];
  viewMode: "grid" | "list";
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function SupplierList({
  suppliers,
  viewMode,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}: SupplierListProps) {
  const getSupplierSlug = (supplier: Supplier): string => {
    if (supplier.slug) return supplier.slug;
    const name = supplier.workshopName || supplier.fullName;
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const getCityName = (city: any): string => {
    if (!city) return "";
    return typeof city === "object" && city !== null ? city.title || "" : city || "";
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
        <p className="mt-4 text-brand-medium-blue">در حال بارگذاری...</p>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
        <p className="text-brand-medium-blue text-lg mb-4">
          تولیدکننده‌ای یافت نشد
        </p>
        <p className="text-brand-medium-gray text-sm">
          لطفا فیلترهای جستجو را تغییر دهید
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`grid gap-6 ${
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {suppliers.map((supplier) => {
          const slug = getSupplierSlug(supplier);
          const cityName = getCityName(supplier.city);

          return (
            <Link
              key={supplier.id}
              href={`/public/supplier/${slug}`}
              className="block h-full"
            >
              <div className={viewMode === "list" ? "h-full" : ""}>
                <SupplierCard
                  name={supplier.workshopName || supplier.fullName}
                  logoUrl={supplier.profileImageUrl || supplier.avatarUrl}
                  city={cityName}
                  equipment={
                    supplier.metadata?.specialties
                      ?.split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  }
                  rating={supplier.rating}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            قبلی
          </Button>
          <span className="text-brand-medium-blue text-sm">
            صفحه {currentPage} از {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            بعدی
          </Button>
        </div>
      )}
    </>
  );
}

