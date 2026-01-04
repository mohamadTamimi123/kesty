"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Portfolio, QuantityRange } from "../../../../types/portfolio";
import { Review } from "../../../../types/review";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import Button from "../../../../components/Button";
import ReviewCard from "../../../../components/ReviewCard";
import StarRating from "../../../../components/StarRating";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  TagIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  GlobeAltIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  if (path.startsWith('/api/')) {
    return `${apiUrl}${path}`;
  }
  return `${apiUrl}/api${path}`;
};

const getQuantityRangeLabel = (range?: QuantityRange): string => {
  switch (range) {
    case QuantityRange.LESS_THAN_100:
      return "کمتر از 100";
    case QuantityRange.BETWEEN_100_1000:
      return "بین 100 تا 1000";
    case QuantityRange.MORE_THAN_1000:
      return "بیشتر از 1000";
    default:
      return "-";
  }
};

export default function SupplierPortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const portfolioId = params?.id as string;
  
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/supplier/portfolio/" + portfolioId);
      return;
    }
  }, [isAuthenticated, router, portfolioId]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!portfolioId || !isAuthenticated) return;

      try {
        setIsLoading(true);
        const [portfolioData, reviewsData] = await Promise.all([
          apiClient.getPortfolioById(portfolioId),
          apiClient.getPortfolioReviews(portfolioId).catch(() => []),
        ]);
        
        // Check if user owns this portfolio
        if (portfolioData.supplierId !== user?.id) {
          toast.error("شما دسترسی به این نمونه کار را ندارید");
          router.push("/dashboard/supplier/portfolio");
          return;
        }
        
        setPortfolio(portfolioData);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (error: unknown) {
        logger.error("Error fetching portfolio", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت نمونه کار";
        toast.error(errorMessage);
        router.push("/dashboard/supplier/portfolio");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && portfolioId) {
      fetchPortfolio();
    }
  }, [portfolioId, isAuthenticated, user, router]);

  const handleDelete = async () => {
    if (!portfolio) return;

    setIsDeleting(true);
    try {
      await apiClient.deletePortfolio(portfolio.id);
      toast.success("نمونه کار با موفقیت حذف شد");
      router.push("/dashboard/supplier/portfolio");
    } catch (error: unknown) {
      logger.error("Error deleting portfolio", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در حذف نمونه کار";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && portfolio) {
      const url = `${window.location.origin}/portfolio/${portfolio.id}`;
      navigator.clipboard.writeText(url);
      toast.success("لینک نمونه کار کپی شد");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue mb-4">نمونه کار یافت نشد</p>
            <Link href="/dashboard/supplier/portfolio">
              <Button variant="primary">بازگشت به لیست نمونه کارها</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = portfolio.images || [];
  const primaryImage = images.find((img) => img.isPrimary) || images[0];
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/supplier/portfolio"
            className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            بازگشت به لیست نمونه کارها
          </Link>
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-brand-dark-blue font-display">
                  {portfolio.title}
                </h1>
                {portfolio.isVerified && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    تایید شده
                  </span>
                )}
                {!portfolio.isVerified && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300 flex items-center gap-1">
                    <XCircleIcon className="w-4 h-4" />
                    در انتظار تایید
                  </span>
                )}
                {portfolio.isPublic ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-300 flex items-center gap-1">
                    <GlobeAltIcon className="w-4 h-4" />
                    عمومی
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium border border-gray-300 flex items-center gap-1">
                    <EyeSlashIcon className="w-4 h-4" />
                    خصوصی
                  </span>
                )}
              </div>
              {portfolio.category && (
                <p className="text-brand-medium-blue mb-2">
                  {portfolio.category.title}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href={`/dashboard/supplier/portfolio/${portfolio.id}/edit`}>
                <Button variant="primary" size="sm">
                  <PencilIcon className="w-4 h-4 ml-2" />
                  ویرایش
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                <TrashIcon className="w-4 h-4 ml-2" />
                حذف
              </Button>
              {portfolio.isPublic && (
                <Link href={`/portfolio/${portfolio.id}`} target="_blank">
                  <Button variant="secondary" size="sm">
                    <EyeIcon className="w-4 h-4 ml-2" />
                    مشاهده عمومی
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-4">
            <div className="flex items-center gap-2 mb-2">
              <EyeIcon className="w-5 h-5 text-brand-medium-blue" />
              <span className="text-sm text-brand-medium-gray">بازدید</span>
            </div>
            <p className="text-2xl font-bold text-brand-dark-blue">{portfolio.viewCount || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-4">
            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={averageRating} size="sm" />
              <span className="text-sm text-brand-medium-gray">امتیاز</span>
            </div>
            <p className="text-2xl font-bold text-brand-dark-blue">
              {averageRating > 0 ? averageRating.toFixed(1) : "-"}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-4">
            <div className="flex items-center gap-2 mb-2">
              <PhotoIcon className="w-5 h-5 text-brand-medium-blue" />
              <span className="text-sm text-brand-medium-gray">تصاویر</span>
            </div>
            <p className="text-2xl font-bold text-brand-dark-blue">{images.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-4">
            <div className="flex items-center gap-2 mb-2">
              <TagIcon className="w-5 h-5 text-brand-medium-blue" />
              <span className="text-sm text-brand-medium-gray">نظرات</span>
            </div>
            <p className="text-2xl font-bold text-brand-dark-blue">{reviews.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow-md border border-brand-medium-gray overflow-hidden">
                <div className="relative w-full h-96 bg-brand-off-white">
                  {primaryImage && (
                    <img
                      src={getImageUrl(primaryImage.imageUrl) || ''}
                      alt={portfolio.title}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedImageIndex(0)}
                    />
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {images.slice(0, 4).map((image, index) => (
                      <div
                        key={index}
                        className="relative h-24 bg-brand-off-white rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={getImageUrl(image.imageUrl) || ''}
                          alt={`${portfolio.title} - تصویر ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl shadow-md border border-brand-medium-gray p-6">
              <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-3 border-b border-brand-medium-gray">
                توضیحات
              </h2>
              <p className="text-brand-medium-blue leading-relaxed whitespace-pre-line">
                {portfolio.description}
              </p>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-md border border-brand-medium-gray p-6">
                <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-3 border-b border-brand-medium-gray">
                  نظرات ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Portfolio Info */}
            <div className="bg-white rounded-xl shadow-md border border-brand-medium-gray p-6">
              <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-3 border-b border-brand-medium-gray">
                اطلاعات نمونه کار
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-brand-medium-gray mb-1">
                    <CalendarIcon className="w-4 h-4" />
                    تاریخ تکمیل
                  </div>
                  <p className="text-brand-dark-blue">
                    {new Date(portfolio.completionDate).toLocaleDateString("fa-IR")}
                  </p>
                </div>

                {portfolio.quantityRange && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-brand-medium-gray mb-1">
                      <TagIcon className="w-4 h-4" />
                      تعداد تولید
                    </div>
                    <p className="text-brand-dark-blue">
                      {getQuantityRangeLabel(portfolio.quantityRange)}
                    </p>
                  </div>
                )}

                {portfolio.machines && portfolio.machines.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-brand-medium-gray mb-2">
                      <WrenchScrewdriverIcon className="w-4 h-4" />
                      دستگاه‌های استفاده شده
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {portfolio.machines.map((machine) => (
                        <span
                          key={machine.id}
                          className="px-3 py-1 bg-brand-off-white text-brand-dark-blue rounded-lg text-sm border border-brand-medium-gray"
                        >
                          {machine.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {portfolio.materials && portfolio.materials.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-brand-medium-gray mb-2">
                      <CubeIcon className="w-4 h-4" />
                      متریال‌های استفاده شده
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {portfolio.materials.map((material) => (
                        <span
                          key={material.id}
                          className="px-3 py-1 bg-brand-off-white text-brand-dark-blue rounded-lg text-sm border border-brand-medium-gray"
                        >
                          {material.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {portfolio.customerName && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-brand-medium-gray mb-1">
                      <TagIcon className="w-4 h-4" />
                      مشتری
                    </div>
                    <p className="text-brand-dark-blue">{portfolio.customerName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Share Button */}
            {portfolio.isPublic && (
              <Button
                variant="secondary"
                onClick={handleShare}
                className="w-full"
              >
                <ShareIcon className="w-5 h-5 ml-2" />
                اشتراک‌گذاری لینک عمومی
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 left-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-brand-dark-blue" />
            </button>
            <img
              src={getImageUrl(images[selectedImageIndex].imageUrl) || ''}
              alt={`${portfolio.title} - تصویر ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImageIndex
                        ? "bg-white"
                        : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-brand-dark-blue mb-4">
              حذف نمونه کار
            </h3>
            <p className="text-brand-medium-blue mb-6">
              آیا از حذف نمونه کار "{portfolio.title}" اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
                className="flex-1"
              >
                حذف
              </Button>
              <Button
                variant="neutral"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

