"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReviewCard from "../../../components/ReviewCard";
import { Review } from "../../../types/review";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";

export default function SupplierReviewsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error: any) {
        console.error("Error fetching reviews:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت نظرات");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchReviews();
    }
  }, [isAuthenticated]);

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

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue">هنوز نظری دریافت نکرده‌اید</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} showPortfolio={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

