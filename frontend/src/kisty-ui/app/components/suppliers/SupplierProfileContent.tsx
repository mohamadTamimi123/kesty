"use client";

import { useState } from "react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { User } from "../../types/user";
import { Category } from "../../types/category";
import { Portfolio } from "../../types/portfolio";
import { Review } from "../../types/review";
import { Project } from "../../types/project";
import PortfolioCard from "../PortfolioCard";
import ReviewCard from "../ReviewCard";
import ProjectCard from "../ProjectCard";

interface SupplierProfileContentProps {
  supplier: User & {
    categories?: Category[];
    portfolios?: Portfolio[];
    reviews?: Review[];
    bio?: string;
  };
  projects: Project[];
  isLoadingProjects?: boolean;
}

export default function SupplierProfileContent({
  supplier,
  projects,
  isLoadingProjects = false,
}: SupplierProfileContentProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<number | null>(null);

  const filteredReviews =
    supplier.reviews?.filter((review) => reviewFilter === null || review.rating === reviewFilter) ||
    [];

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Specialties */}
      {supplier.categories && supplier.categories.length > 0 && (
        <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
          <h2 className="text-xl font-bold text-brand-dark-blue mb-4">تخصص‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {supplier.categories.map((category) => (
              <span
                key={category.id}
                className="px-3 py-1 bg-brand-light-sky text-brand-medium-blue rounded-full text-sm font-medium"
              >
                {category.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {supplier.bio && (
        <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
          <h2 className="text-xl font-bold text-brand-dark-blue mb-4">درباره ما</h2>
          <p className="text-brand-medium-blue whitespace-pre-line leading-relaxed">
            {supplier.bio}
          </p>
        </div>
      )}

      {/* Portfolio */}
      <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
        <h2 className="text-xl font-bold text-brand-dark-blue mb-4">
          نمونه کارها ({supplier.portfolios?.length || 0})
        </h2>
        {supplier.portfolios && supplier.portfolios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.portfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
            ))}
          </div>
        ) : (
          <p className="text-brand-medium-gray text-center py-8">
            هنوز نمونه کاری ثبت نشده است
          </p>
        )}
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brand-dark-blue">
              پروژه‌های مرتبط ({projects.length})
            </h2>
          </div>
          {isLoadingProjects ? (
            <div className="text-center py-8 text-brand-medium-blue">
              در حال بارگذاری پروژه‌ها...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews */}
      {supplier.reviews && supplier.reviews.length > 0 && (
        <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brand-dark-blue">
              نظرات ({supplier.reviews.length})
            </h2>
            {supplier.reviews.length > 5 && (
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-brand-medium-blue" />
                <select
                  value={reviewFilter || ""}
                  onChange={(e) =>
                    setReviewFilter(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="text-sm border border-brand-medium-gray rounded px-2 py-1 text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="">همه امتیازها</option>
                  <option value="5">5 ستاره</option>
                  <option value="4">4 ستاره</option>
                  <option value="3">3 ستاره</option>
                  <option value="2">2 ستاره</option>
                  <option value="1">1 ستاره</option>
                </select>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          {filteredReviews.length > 5 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="mt-4 w-full py-2 text-brand-medium-blue hover:text-brand-dark-blue transition-colors font-medium border-t border-brand-light-gray pt-4"
            >
              {showAllReviews
                ? "نمایش کمتر"
                : `نمایش همه نظرات (${filteredReviews.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

