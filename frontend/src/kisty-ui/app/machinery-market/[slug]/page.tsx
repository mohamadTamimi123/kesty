"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Breadcrumb, { BreadcrumbItem } from "../../../components/Breadcrumb";
import { MachineListing, ListingType, MachineCondition } from "../../../types/machine-listing";
import apiClient from "../../../lib/api";
import toast from "react-hot-toast";

export default function MachineListingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [listing, setListing] = useState<MachineListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        const listingData = await apiClient.getMachineListingBySlug(slug);
        setListing(listingData);
      } catch (error: any) {
        console.error("Error fetching listing:", error);
        toast.error("خطا در دریافت آگهی");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchListing();
    }
  }, [slug]);

  const formatPrice = (price: number | null) => {
    if (!price) return "قیمت توافقی";
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  const getListingTypeLabel = () => {
    return listing?.listingType === ListingType.FOR_SALE ? "فروش" : "اجاره";
  };

  const getConditionLabel = () => {
    return listing?.condition === MachineCondition.NEW ? "نو" : "کارکرده";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-medium-blue">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-dark-blue">آگهی یافت نشد</div>
        </div>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "خانه", href: "/" },
    { label: "بازارگاه ماشین‌آلات", href: "/machinery-market" },
    { label: listing.title },
  ];

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Listing Details */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-8 md:p-12">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-brand-dark-blue font-display flex-1">
                {listing.title}
              </h1>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                {getListingTypeLabel()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-brand-medium-gray">
              {listing.city && (
                <span>📍 {listing.city.title}</span>
              )}
              <span className="px-2 py-1 bg-brand-light-sky rounded">
                {getConditionLabel()}
              </span>
              <span>👁 {listing.viewCount} بازدید</span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-brand-light-sky rounded-lg p-6 mb-6 text-center">
            <p className="text-sm text-brand-medium-gray mb-2">قیمت</p>
            <p className="text-3xl font-bold text-brand-dark-blue">
              {formatPrice(listing.price)}
            </p>
          </div>

          {/* Machine Info */}
          {listing.machine && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-brand-dark-blue mb-2 font-display">
                اطلاعات ماشین
              </h3>
              <p className="text-brand-medium-blue">{listing.machine.name}</p>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-brand-dark-blue mb-3 font-display">
                توضیحات
              </h3>
              <div
                className="prose prose-lg max-w-none text-brand-medium-blue leading-relaxed"
                dangerouslySetInnerHTML={{ __html: listing.description }}
              />
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
              اطلاعات تماس
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-brand-medium-blue">تلفن:</span>
              <a
                href={`tel:${listing.contactPhone}`}
                className="text-brand-medium-blue font-medium hover:text-brand-dark-blue"
              >
                {listing.contactPhone}
              </a>
            </div>
            {listing.supplierProfile && (
              <div className="mt-2">
                <span className="text-brand-medium-blue">تولیدکننده:</span>
                <span className="text-brand-dark-blue font-medium mr-2">
                  {listing.supplierProfile.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

