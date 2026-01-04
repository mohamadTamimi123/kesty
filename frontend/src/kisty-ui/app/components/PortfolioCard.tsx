"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Portfolio } from "../types/portfolio";
import StarRating from "./StarRating";
import { useAuth } from "../contexts/AuthContext";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface PortfolioCardProps {
  portfolio: Portfolio;
  showSupplier?: boolean;
  isSupplierView?: boolean; // If true, link to supplier detail page instead of public page
  onEdit?: (portfolio: Portfolio) => void;
  onDelete?: (portfolio: Portfolio) => void;
  showActions?: boolean; // Show edit/delete actions
}

const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  // Handle both /api/uploads/... and /uploads/... formats
  if (path.startsWith('/api/')) {
    return `${apiUrl}${path}`;
  }
  return `${apiUrl}/api${path}`;
};

function PortfolioCard({ 
  portfolio, 
  showSupplier = false, 
  isSupplierView = false,
  onEdit,
  onDelete,
  showActions = false
}: PortfolioCardProps) {
  const { user } = useAuth();
  const primaryImage = portfolio.images?.find((img) => img.isPrimary) || portfolio.images?.[0];
  const imageUrl = primaryImage?.imageUrl ? getImageUrl(primaryImage.imageUrl) : null;

  // Determine the correct link based on context
  const getPortfolioLink = () => {
    if (isSupplierView || (user && portfolio.supplierId === user.id)) {
      return `/dashboard/supplier/portfolio/${portfolio.id}`;
    }
    return `/public/portfolio/${portfolio.id}`;
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(portfolio);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(portfolio);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden hover:shadow-lg transition-all flex flex-col">
      <Link href={getPortfolioLink()} className="flex-1">
        <div className="relative w-full h-48 bg-brand-off-white">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={portfolio.title}
              fill
              className="object-cover"
              unoptimized
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
      </Link>
      
      {/* Action buttons at bottom - always visible for supplier view */}
      {showActions && (onEdit || onDelete) && (
        <div className="px-4 pb-4 pt-3 border-t border-brand-medium-gray bg-brand-off-white/50">
          <div className="flex gap-2">
            {onEdit && (
              <Link
                href={`/dashboard/supplier/portfolio/${portfolio.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-3 py-2 text-sm bg-brand-light-sky text-brand-medium-blue rounded-lg hover:bg-brand-medium-blue hover:text-white transition-all flex items-center justify-center gap-2 border border-brand-medium-gray font-medium shadow-sm hover:shadow-md"
              >
                <PencilIcon className="w-4 h-4" />
                ویرایش
              </Link>
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-300 font-medium shadow-sm hover:shadow-md"
              >
                <TrashIcon className="w-4 h-4" />
                حذف
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PortfolioCard);

