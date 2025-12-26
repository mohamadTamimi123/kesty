"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "../../../lib/api";
import { User } from "../../../types/user";
import { Portfolio } from "../../../types/portfolio";
import { Review } from "../../../types/review";
import { Category } from "../../../types/category";
import toast from "react-hot-toast";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import PortfolioCard from "../../components/PortfolioCard";
import ReviewCard from "../../components/ReviewCard";

interface SupplierProfile extends User {
  categories?: Category[];
  portfolios?: Portfolio[];
  reviews?: Review[];
}

export default function SupplierProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getSupplierBySlug(slug);
        setSupplier(data);
      } catch (error: any) {
        console.error("Error fetching supplier:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت اطلاعات تولیدکننده");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchSupplier();
    }
  }, [slug]);

  const handleSendMessage = async () => {
    if (!supplier) return;
    
    try {
      const conversation = await apiClient.createConversation(supplier.id);
      router.push(`/messaging/${conversation.id}`);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error("خطا در ایجاد مکالمه");
    }
  };

  const calculateAverageRating = () => {
    if (!supplier?.reviews || supplier.reviews.length === 0) return 0;
    const sum = supplier.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / supplier.reviews.length).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-brand-medium-blue">در حال بارگذاری...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-brand-medium-blue">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-medium-blue mb-4">تولیدکننده یافت نشد</p>
          <button
            onClick={() => router.back()}
            className="text-brand-medium-blue hover:text-brand-dark-blue"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-brand-medium-gray p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 bg-brand-light-sky rounded-lg flex items-center justify-center flex-shrink-0">
              {supplier.profileImageUrl ? (
                <img
                  src={supplier.profileImageUrl}
                  alt={supplier.workshopName || supplier.fullName}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              ) : (
                <BuildingOfficeIcon className="w-16 h-16 text-brand-medium-blue" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-brand-dark-blue mb-2 font-display">
                {supplier.workshopName || supplier.fullName}
              </h1>
              {averageRating !== "0" && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIconSolid
                        key={star}
                        className={`w-5 h-5 ${
                          star <= parseFloat(averageRating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-brand-medium-blue font-medium">
                    {averageRating} ({supplier.reviews?.length || 0} نظر)
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-brand-medium-blue">
                {supplier.city && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5" />
                    <span>{supplier.city}</span>
                  </div>
                )}
                {supplier.workshopPhone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5" />
                    <span>{supplier.workshopPhone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-5 h-5" />
                    <span>{supplier.email}</span>
                  </div>
                )}
              </div>
              {supplier.workshopAddress && (
                <div className="mt-4 text-brand-medium-blue">
                  <MapPinIcon className="w-4 h-4 inline mr-2" />
                  <span>{supplier.workshopAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Specialties */}
            {supplier.categories && supplier.categories.length > 0 && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <h2 className="text-xl font-bold text-brand-dark-blue mb-4">تخصص‌ها</h2>
                <div className="flex flex-wrap gap-2">
                  {supplier.categories.map((category) => (
                    <span
                      key={category.id}
                      className="px-3 py-1 bg-brand-light-sky text-brand-medium-blue rounded-full text-sm"
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
                <p className="text-brand-medium-blue whitespace-pre-line">{supplier.bio}</p>
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
                <p className="text-brand-medium-gray">هنوز نمونه کاری ثبت نشده است</p>
              )}
            </div>

            {/* Reviews */}
            {supplier.reviews && supplier.reviews.length > 0 && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <h2 className="text-xl font-bold text-brand-dark-blue mb-4">
                  نظرات ({supplier.reviews.length})
                </h2>
                <div className="space-y-4">
                  {supplier.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-xl font-bold text-brand-dark-blue mb-4">تماس با ما</h2>
              <button
                onClick={handleSendMessage}
                className="w-full bg-brand-medium-blue text-white py-3 rounded-lg hover:bg-brand-dark-blue transition-colors flex items-center justify-center gap-2"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                ارسال پیام
              </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-xl font-bold text-brand-dark-blue mb-4">آمار</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-brand-medium-blue">نمونه کارها:</span>
                  <span className="font-bold text-brand-dark-blue">
                    {supplier.portfolios?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-medium-blue">نظرات:</span>
                  <span className="font-bold text-brand-dark-blue">
                    {supplier.reviews?.length || 0}
                  </span>
                </div>
                {averageRating !== "0" && (
                  <div className="flex justify-between">
                    <span className="text-brand-medium-blue">امتیاز:</span>
                    <span className="font-bold text-brand-dark-blue">{averageRating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

