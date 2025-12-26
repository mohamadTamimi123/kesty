"use client";

import { SupplierRating } from "../types/rating";
import { TrophyIcon } from "@heroicons/react/24/solid";

interface RatingDisplayProps {
  rating: SupplierRating;
  showBreakdown?: boolean;
}

export default function RatingDisplay({ rating, showBreakdown = false }: RatingDisplayProps) {
  const getLevel = (score: number) => {
    if (score >= 80) return { name: "طلایی", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    if (score >= 60) return { name: "نقره‌ای", color: "text-gray-600", bgColor: "bg-gray-100" };
    if (score >= 40) return { name: "برنزی", color: "text-orange-600", bgColor: "bg-orange-100" };
    return { name: "عادی", color: "text-brand-medium-blue", bgColor: "bg-brand-light-sky" };
  };

  const level = getLevel(rating.totalScore);

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 ${level.bgColor} rounded-lg flex items-center justify-center`}>
          <TrophyIcon className={`w-8 h-8 ${level.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-brand-dark-blue mb-1">
            امتیاز کلی: {rating.totalScore.toFixed(1)}
          </h3>
          <p className={`text-sm font-medium ${level.color}`}>
            سطح {level.name}
          </p>
        </div>
      </div>

      {showBreakdown && (
        <div className="space-y-3 border-t border-brand-medium-gray pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-medium-blue">طرح پریمیوم</span>
            <span className="text-sm font-medium text-brand-dark-blue">
              {rating.premiumScore.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-medium-blue">نظرات کاربران</span>
            <span className="text-sm font-medium text-brand-dark-blue">
              {rating.reviewScore.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-medium-blue">تکمیل پروفایل</span>
            <span className="text-sm font-medium text-brand-dark-blue">
              {rating.profileScore.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-medium-blue">سرعت پاسخگویی</span>
            <span className="text-sm font-medium text-brand-dark-blue">
              {rating.responseScore.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-medium-blue">فعالیت</span>
            <span className="text-sm font-medium text-brand-dark-blue">
              {rating.activityScore.toFixed(1)}
            </span>
          </div>
          {rating.penalties > 0 && (
            <div className="flex justify-between items-center text-red-600">
              <span className="text-sm">جریمه‌ها</span>
              <span className="text-sm font-medium">-{rating.penalties.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

