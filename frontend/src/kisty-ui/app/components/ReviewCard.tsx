"use client";

import { Review } from "../types/review";
import StarRating from "./StarRating";

interface ReviewCardProps {
  review: Review;
  showPortfolio?: boolean;
}

export default function ReviewCard({ review, showPortfolio = false }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StarRating rating={review.rating} size="sm" />
            {review.customer && (
              <span className="text-sm font-medium text-brand-dark-blue">
                {review.customer.fullName}
              </span>
            )}
          </div>
          {showPortfolio && review.portfolio && (
            <p className="text-xs text-brand-medium-blue mb-2">
              برای: {review.portfolio.title}
            </p>
          )}
        </div>
        <span className="text-xs text-brand-medium-gray">
          {new Date(review.createdAt).toLocaleDateString("fa-IR")}
        </span>
      </div>
      {review.comment && (
        <p className="text-sm text-brand-medium-blue leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}

