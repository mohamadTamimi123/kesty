"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReviewRequest } from "../../../types/review";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import Button from "../../../components/Button";

export default function CustomerReviewsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMyReviews();
        setRequests(Array.isArray(response) ? response : []);
      } catch (error: any) {
        console.error("Error fetching review requests:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت درخواست‌ها");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchRequests();
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
          درخواست‌های نظر
        </h1>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue mb-4">درخواست نظری دریافت نکرده‌اید</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">
                      {request.portfolio?.title}
                    </h3>
                    {request.supplier && (
                      <p className="text-sm text-brand-medium-blue">
                        از: {request.supplier.fullName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-brand-medium-gray">
                    {new Date(request.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                {request.message && (
                  <p className="text-sm text-brand-medium-blue mb-4">{request.message}</p>
                )}
                <Link href={`/dashboard/customer/reviews/${request.id}`}>
                  <Button variant="primary" size="sm">
                    ثبت نظر
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

