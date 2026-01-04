"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReviewCard from "../../../components/ReviewCard";
import { Review } from "../../../types/review";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";

export default function SupplierReviewsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterPortfolio, setFilterPortfolio] = useState<string>("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSupplierReviews();
        setReviews(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching reviews", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت نظرات";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchReviews();
    }
  }, [isAuthenticated]);

  const filteredAndSortedReviews = reviews
    .filter((review) => {
      const matchesSearch =
        review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (review.customer as any)?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.portfolio?.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRating =
        filterRating === "all" ||
        (filterRating === "5" && review.rating === 5) ||
        (filterRating === "4" && review.rating === 4) ||
        (filterRating === "3" && review.rating === 3) ||
        (filterRating === "2" && review.rating === 2) ||
        (filterRating === "1" && review.rating === 1) ||
        (filterRating === "high" && review.rating >= 4) ||
        (filterRating === "low" && review.rating <= 2);

      const matchesPortfolio =
        filterPortfolio === "all" ||
        (filterPortfolio === "with-portfolio" && review.portfolio) ||
        (filterPortfolio === "without-portfolio" && !review.portfolio) ||
        review.portfolioId === filterPortfolio;

      return matchesSearch && matchesRating && matchesPortfolio;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "rating-desc":
          return b.rating - a.rating;
        case "rating-asc":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  const stats = {
    total: reviews.length,
    averageRating:
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
    ratingDistribution: {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    },
  };

  const uniquePortfolios = Array.from(
    new Map(
      reviews
        .map((r) => [r.portfolioId, r.portfolio] as [string, typeof r.portfolio])
        .filter(([id]) => id)
    ).values()
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-brand-medium-blue py-12">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-8">
          نظرات دریافت شده
        </h1>

        {/* Stats Cards */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-5 h-5 text-brand-medium-blue" />
                <span className="text-sm text-brand-medium-blue">کل نظرات</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">{stats.total}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <StarIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-brand-medium-blue">میانگین امتیاز</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">
                {stats.averageRating.toFixed(1)}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <StarIconSolid className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-brand-medium-blue">امتیاز 5 ستاره</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">
                {stats.ratingDistribution[5]}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <StarIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-brand-medium-blue">امتیاز 4+ ستاره</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">
                {stats.ratingDistribution[5] + stats.ratingDistribution[4]}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters Bar */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray" />
                <input
                  type="text"
                  placeholder="جستجو در نظرات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowsUpDownIcon className="w-5 h-5 text-brand-medium-gray" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="date-desc">جدیدترین</option>
                  <option value="date-asc">قدیمی‌ترین</option>
                  <option value="rating-desc">بالاترین امتیاز</option>
                  <option value="rating-asc">پایین‌ترین امتیاز</option>
                </select>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                  showFilters
                    ? "bg-brand-medium-blue text-white border-brand-medium-blue"
                    : "border-brand-medium-gray text-brand-medium-blue hover:bg-brand-off-white"
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                فیلترها
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-brand-medium-gray grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    امتیاز
                  </label>
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                  >
                    <option value="all">همه</option>
                    <option value="5">5 ستاره</option>
                    <option value="4">4 ستاره</option>
                    <option value="3">3 ستاره</option>
                    <option value="2">2 ستاره</option>
                    <option value="1">1 ستاره</option>
                    <option value="high">4+ ستاره</option>
                    <option value="low">2- ستاره</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    نمونه کار مرتبط
                  </label>
                  <select
                    value={filterPortfolio}
                    onChange={(e) => setFilterPortfolio(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                  >
                    <option value="all">همه</option>
                    <option value="with-portfolio">دارای نمونه کار</option>
                    <option value="without-portfolio">بدون نمونه کار</option>
                    {uniquePortfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {filteredAndSortedReviews.length > 0 && (
          <div className="mb-4 text-sm text-brand-medium-blue">
            نمایش {filteredAndSortedReviews.length} از {reviews.length} نظر
          </div>
        )}

        {/* Reviews List */}
        {filteredAndSortedReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue">
              {searchQuery || filterRating !== "all" || filterPortfolio !== "all"
                ? "نتیجه‌ای یافت نشد"
                : "هنوز نظری دریافت نکرده‌اید"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} showPortfolio={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

