"use client";

import Link from "next/link";
import Image from "next/image";
import { Portfolio } from "../types/portfolio";
import StarRating from "./StarRating";

interface PortfolioCardProps {
  portfolio: Portfolio;
  showSupplier?: boolean;
}

export default function PortfolioCard({ portfolio, showSupplier = false }: PortfolioCardProps) {
  const primaryImage = portfolio.images?.find((img) => img.isPrimary) || portfolio.images?.[0];
  const imageUrl = primaryImage?.imageUrl || "/placeholder-portfolio.jpg";

  return (
    <Link href={`/portfolio/${portfolio.id}`}>
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative w-full h-48 bg-brand-off-white">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={portfolio.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-medium-gray">
              <span>بدون تصویر</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-brand-dark-blue mb-2 line-clamp-2">
            {portfolio.title}
          </h3>
          {portfolio.category && (
            <p className="text-sm text-brand-medium-blue mb-2">
              {portfolio.category.title}
            </p>
          )}
          {portfolio.rating && (
            <div className="mb-2">
              <StarRating rating={portfolio.rating} size="sm" />
            </div>
          )}
          {showSupplier && portfolio.supplier && (
            <p className="text-xs text-brand-medium-gray mt-2">
              توسط {portfolio.supplier.fullName}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

