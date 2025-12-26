"use client";

import Link from "next/link";
import { MachineListing, ListingType, MachineCondition } from "../types/machine-listing";

interface MachineListingCardProps {
  listing: MachineListing;
}

export default function MachineListingCard({ listing }: MachineListingCardProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return "قیمت توافقی";
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  const getListingTypeLabel = () => {
    return listing.listingType === ListingType.FOR_SALE ? "فروش" : "اجاره";
  };

  const getConditionLabel = () => {
    return listing.condition === MachineCondition.NEW ? "نو" : "کارکرده";
  };

  return (
    <Link href={`/machinery-market/${listing.slug}`}>
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-brand-dark-blue font-display group-hover:text-brand-medium-blue transition-colors line-clamp-2 flex-1">
              {listing.title}
            </h3>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium mr-2 whitespace-nowrap">
              {getListingTypeLabel()}
            </span>
          </div>

          {listing.machine && (
            <p className="text-sm text-brand-medium-blue mb-2">
              ماشین: {listing.machine.name}
            </p>
          )}

          {listing.city && (
            <p className="text-sm text-brand-medium-gray mb-3">
              📍 {listing.city.title}
            </p>
          )}

          {listing.description && (
            <p className="text-sm text-brand-medium-blue mb-3 line-clamp-2">
              {listing.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-brand-medium-gray">
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2 py-1 bg-brand-light-sky rounded">
                {getConditionLabel()}
              </span>
              <span className="font-bold text-brand-dark-blue">
                {formatPrice(listing.price)}
              </span>
            </div>
            <span className="text-xs text-brand-medium-gray">
              👁 {listing.viewCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

