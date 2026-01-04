"use client";

import Image from "next/image";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShareIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { Supplier } from "../../types/supplier";
import { Category } from "../../types/category";
import { Review } from "../../types/review";

interface SupplierProfileHeaderProps {
  supplier: Supplier & {
    categories?: Category[];
    reviews?: Review[];
  };
  averageRating: string;
  onShare: () => void;
  onCopyLink: () => void;
}

export default function SupplierProfileHeader({
  supplier,
  averageRating,
  onShare,
  onCopyLink,
}: SupplierProfileHeaderProps) {
  const getImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const apiUrl =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3000", ":3001")
        : "http://localhost:3001";
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${apiUrl}/api${path}`;
  };

  const getCityName = (city: any): string => {
    if (!city) return "";
    return typeof city === "object" && city !== null ? city.title || "" : city || "";
  };

  const imageUrl = getImageUrl(supplier.profileImageUrl || supplier.avatarUrl);

  return (
    <div className="bg-white rounded-lg border border-brand-medium-gray p-6 shadow-sm">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-brand-light-sky flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={supplier.workshopName || supplier.fullName}
              fill
              className="object-cover"
              unoptimized
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <BuildingOfficeIcon className="w-16 h-16 text-brand-medium-blue" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold text-brand-dark-blue font-display">
              {supplier.workshopName || supplier.fullName}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={onShare}
                className="p-2 rounded-lg hover:bg-brand-light-sky transition-colors"
                title="اشتراک‌گذاری"
                aria-label="اشتراک‌گذاری"
              >
                <ShareIcon className="w-5 h-5 text-brand-medium-blue" />
              </button>
              <button
                onClick={onCopyLink}
                className="p-2 rounded-lg hover:bg-brand-light-sky transition-colors"
                title="کپی لینک"
                aria-label="کپی لینک"
              >
                <LinkIcon className="w-5 h-5 text-brand-medium-blue" />
              </button>
            </div>
          </div>

          {/* Rating */}
          {averageRating !== "0" && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIconSolid
                    key={star}
                    className={`w-5 h-5 ${
                      star <= parseFloat(averageRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-brand-medium-blue font-medium">
                {averageRating} ({supplier.reviews?.length || 0} نظر)
              </span>
            </div>
          )}

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 text-brand-medium-blue">
            {supplier.city && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                <span>{getCityName(supplier.city)}</span>
              </div>
            )}
            {supplier.workshopPhone && (
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-5 h-5 flex-shrink-0" />
                <span>{supplier.workshopPhone}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-5 h-5 flex-shrink-0" />
                <span>{supplier.email}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {supplier.workshopAddress && (
            <div className="mt-4 text-brand-medium-blue flex items-start gap-2">
              <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-1" />
              <span>{supplier.workshopAddress}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

