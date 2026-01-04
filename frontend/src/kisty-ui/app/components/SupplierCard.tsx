"use client";

import { memo, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface SupplierCardProps {
  name: string;
  logoUrl?: string | null;
  rating?: number;
  establishedYear?: number;
  equipment?: string[];
  city?: string;
  category?: string;
}

function SupplierCard({
  name,
  logoUrl,
  rating,
  establishedYear,
  equipment,
  city,
  category,
}: SupplierCardProps) {
  const [imageError, setImageError] = useState(false);

  const getLogoUrl = useCallback((url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const apiUrl =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3000", ":3001")
        : "http://localhost:3001";
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${apiUrl}/api${path}`;
  }, []);

  const imageUrl = useMemo(() => getLogoUrl(logoUrl), [logoUrl, getLogoUrl]);
  const showImage = imageUrl && !imageError;

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6 hover:shadow-lg transition-all h-full flex flex-col">
      <div className="flex items-start gap-4 flex-1">
        {/* Logo/Avatar */}
        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-brand-light-gray flex items-center justify-center">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              unoptimized
              onError={handleImageError}
            />
          ) : (
            <BuildingOfficeIcon className="w-8 h-8 text-brand-medium-blue" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-brand-dark-blue mb-2 font-display line-clamp-2">
            {name}
          </h3>

          <div className="flex flex-wrap gap-3 text-sm text-brand-medium-blue mb-3">
            {rating && rating > 0 && (
              <div className="flex items-center gap-1">
                <StarIconSolid className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
            {establishedYear && (
              <div className="text-xs">تأسیس: {establishedYear}</div>
            )}
            {city && (
              <div className="text-xs truncate max-w-[120px]" title={city}>
                {city}
              </div>
            )}
          </div>

          {equipment && equipment.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto">
              {equipment.slice(0, 3).map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-brand-light-sky text-brand-medium-blue rounded text-xs whitespace-nowrap"
                >
                  {item}
                </span>
              ))}
              {equipment.length > 3 && (
                <span className="px-2 py-1 bg-brand-light-gray text-brand-medium-blue rounded text-xs">
                  +{equipment.length - 3} بیشتر
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SupplierCard);

