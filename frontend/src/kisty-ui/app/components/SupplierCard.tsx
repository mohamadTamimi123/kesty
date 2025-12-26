"use client";

import Image from "next/image";

interface SupplierCardProps {
  name: string;
  logoUrl?: string | null;
  rating?: number;
  establishedYear?: number;
  equipment?: string[];
  city?: string;
  category?: string;
}

export default function SupplierCard({
  name,
  logoUrl,
  rating,
  establishedYear,
  equipment,
  city,
  category,
}: SupplierCardProps) {
  const getLogoUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiUrl = typeof window !== 'undefined' 
      ? window.location.origin.replace(':3000', ':3001')
      : 'http://localhost:3001';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${apiUrl}/api${path}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6 hover:shadow-lg transition-all">
      <div className="flex items-start gap-4">
        {logoUrl && (
          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-brand-light-gray">
            <Image
              src={getLogoUrl(logoUrl) || '/placeholder-supplier.png'}
              alt={name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-brand-dark-blue mb-2 font-display">
            {name}
          </h3>
          
          <div className="flex flex-wrap gap-3 text-sm text-brand-medium-blue mb-3">
            {rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
            {establishedYear && (
              <div>
                تأسیس: {establishedYear}
              </div>
            )}
            {city && (
              <div>
                {city}
              </div>
            )}
          </div>

          {equipment && equipment.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {equipment.slice(0, 3).map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-brand-light-sky text-brand-medium-blue rounded text-xs"
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

