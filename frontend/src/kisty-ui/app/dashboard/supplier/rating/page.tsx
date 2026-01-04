"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import apiClient from "../../../lib/api";
import { SupplierRating } from "../../../types/rating";
import { calculateProfileCompletion } from "../../../utils/profile";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  StarIcon,
  TrophyIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

interface FactorCardProps {
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: "implemented" | "development";
  description: string;
  guidelines: string[];
  icon: React.ReactNode;
}

function FactorCard({
  title,
  score,
  maxScore,
  percentage,
  status,
  description,
  guidelines,
  icon,
}: FactorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scoreColor =
    percentage >= 80
      ? "text-green-600"
      : percentage >= 50
      ? "text-yellow-600"
      : "text-red-600";
  const bgColor =
    percentage >= 80
      ? "bg-green-50"
      : percentage >= 50
      ? "bg-yellow-50"
      : "bg-red-50";
  const borderColor =
    percentage >= 80
      ? "border-green-200"
      : percentage >= 50
      ? "border-yellow-200"
      : "border-red-200";

  return (
    <div
      className={`bg-white rounded-lg shadow-md border ${borderColor} overflow-hidden`}
    >
      <div
        className={`p-6 ${bgColor} cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-brand-dark-blue">
                  {title}
                </h3>
                {status === "development" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    در توسعه - به زودی
                  </span>
                )}
              </div>
              <p className="text-sm text-brand-medium-blue">{description}</p>
            </div>
          </div>
          <div className="text-right ml-4">
            <div className={`text-3xl font-bold ${scoreColor}`}>
              {score.toFixed(1)}
            </div>
            <div className="text-sm text-brand-medium-blue">
              از {maxScore} امتیاز
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  percentage >= 80
                    ? "bg-green-600"
                    : percentage >= 50
                    ? "bg-yellow-600"
                    : "bg-red-600"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <button className="mr-4 text-brand-medium-gray hover:text-brand-dark-blue">
            {isExpanded ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="p-6 border-t border-brand-medium-gray">
          <h4 className="font-semibold text-brand-dark-blue mb-3">
            راهنمای بهبود امتیاز:
          </h4>
          <ul className="space-y-2">
            {guidelines.map((guideline, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-brand-medium-blue"
              >
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SupplierRatingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState<SupplierRating | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Fetch rating
        try {
          const supplierRating = await apiClient.getSupplierRating(user.id);
          setRating(supplierRating);
        } catch (error) {
          logger.error("Error fetching rating", error);
          // Create default rating if API fails
          setRating({
            id: "",
            supplierId: user.id,
            totalScore: 0,
            premiumScore: 30, // Full points for development
            reviewScore: 0,
            profileScore: 0,
            responseScore: 15, // Full points for development
            activityScore: 10, // Full points for development
            penalties: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Fetch profile for completion calculation
        try {
          const profile = await apiClient.getMyProfile();
          const portfolios = await apiClient.getMyPortfolios();
          
          // Try to fetch machines and materials, but don't fail if they don't exist
          let machines: any[] = [];
          let materials: any[] = [];
          try {
            if (apiClient.getMyMachines) {
              machines = await apiClient.getMyMachines();
            }
          } catch (e) {
            // Machines API might not exist
          }
          try {
            if (apiClient.getMyMaterials) {
              materials = await apiClient.getMyMaterials();
            }
          } catch (e) {
            // Materials API might not exist
          }

          const completion = calculateProfileCompletion(profile, {
            portfolioCount: portfolios?.length || 0,
            hasProfileImage: !!profile.profileImageUrl,
            hasCoverImage: false,
            machineCount: machines?.length || 0,
            materialCount: materials?.length || 0,
          });
          setProfileCompletion(completion);
        } catch (error) {
          logger.error("Error fetching profile", error);
        }
      } catch (error) {
        logger.error("Error fetching rating data", error);
        toast.error("خطا در دریافت اطلاعات امتیاز");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user?.id) {
      fetchData();
    }
  }, [isAuthenticated, user?.id]);

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

  if (!rating) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-brand-medium-blue py-12">
            خطا در دریافت اطلاعات امتیاز
          </div>
        </div>
      </div>
    );
  }

  // Helper function to safely convert to number
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Calculate profile score from completion percentage
  const calculatedProfileScore = safeNumber(profileCompletion, 0) / 100 * 20;
  const calculatedActivityScore = safeNumber(profileCompletion, 0) / 100 * 10;

  // Use actual scores or calculated ones, ensure all are numbers
  const premiumScore = safeNumber(rating.premiumScore, 30); // Full points for development
  const reviewScore = safeNumber(rating.reviewScore, 0);
  const profileScore = rating.profileScore !== undefined && rating.profileScore !== null
    ? safeNumber(rating.profileScore, 0)
    : calculatedProfileScore;
  const responseScore = safeNumber(rating.responseScore, 15); // Full points for development
  const activityScore = rating.activityScore !== undefined && rating.activityScore !== null
    ? safeNumber(rating.activityScore, 0)
    : calculatedActivityScore;
  const penalties = safeNumber(rating.penalties, 0);

  const totalScore = Math.max(
    0,
    premiumScore +
      reviewScore +
      profileScore +
      responseScore +
      activityScore -
      penalties
  );

  // Ensure totalScore is a valid number
  const finalTotalScore = isNaN(totalScore) ? 0 : Math.round(totalScore * 10) / 10;

  const factors = [
    {
      title: "طرح پریمیوم",
      score: Number(premiumScore) || 0,
      maxScore: 30,
      percentage: ((Number(premiumScore) || 0) / 30) * 100,
      status: "development" as const,
      description: "اصلی‌ترین فاکتور درآمدزایی",
      guidelines: [
        "خرید طرح طلایی: 30 امتیاز (بالاترین سطح - نمایش اولویت‌دار)",
        "خرید طرح نقرهای: 24 امتیاز (سطح متوسط - نمایش ویژه)",
        "خرید طرح برنزی: 18 امتیاز (سطح پایه - نمایش برجسته)",
        "این قابلیت در حال توسعه است و به زودی در دسترس خواهد بود",
      ],
      icon: <TrophyIcon className="w-6 h-6 text-yellow-600" />,
    },
    {
      title: "نظرات کاربران",
      score: Number(reviewScore) || 0,
      maxScore: 25,
      percentage: ((Number(reviewScore) || 0) / 25) * 100,
      status: "implemented" as const,
      description: "کیفیت خدمات بر اساس بازخورد مشتریان",
      guidelines: [
        "میانگین امتیاز (70%): میانگین نظرات 1-5 ستاره از پروژه‌های تکمیل شده",
        "تعداد نظرات (30%): نظرات تأییدشده و معتبر از هر پروژه",
        "برای بهبود: پروژه‌های باکیفیت انجام دهید و از مشتریان بخواهید نظر بدهند",
        "نظرات بر اساس پروژه‌های تکمیل شده محاسبه می‌شوند، نه نمونه کارها",
      ],
      icon: <StarIcon className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "تکمیل پروفایل",
      score: Number(profileScore) || 0,
      maxScore: 20,
      percentage: ((Number(profileScore) || 0) / 20) * 100,
      status: "implemented" as const,
      description: "کامل بودن اطلاعات کارگاه",
      guidelines: [
        "گالری نمونه کارها (40%): حداقل 3 پروژه کامل ثبت کنید",
        "اطلاعات پایه کارگاه (25%): نام، شهر، تلفن، آدرس را تکمیل کنید",
        "عکس پروفایل و کاور (15%): عکس‌های باکیفیت آپلود کنید",
        "لیست ماشین‌آلات (12%): حداقل 3 دستگاه اضافه کنید",
        "متریال‌های قابل اجرا (8%): مواد اولیه انتخابی را مشخص کنید",
      ],
      icon: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
    },
    {
      title: "سرعت پاسخگویی",
      score: Number(responseScore) || 0,
      maxScore: 15,
      percentage: ((Number(responseScore) || 0) / 15) * 100,
      status: "development" as const,
      description: "تعهد در ارتباط با مشتریان",
      guidelines: [
        "کمتر از 2 ساعت: 15 امتیاز",
        "2-12 ساعت: 10 امتیاز",
        "بیش از 12 ساعت: 5 امتیاز",
        "این قابلیت در حال توسعه است و به زودی در دسترس خواهد بود",
      ],
      icon: <InformationCircleIcon className="w-6 h-6 text-purple-600" />,
    },
    {
      title: "فعالیت اخیر",
      score: Number(activityScore) || 0,
      maxScore: 10,
      percentage: ((Number(activityScore) || 0) / 10) * 100,
      status: "development" as const,
      description: "حضور و مشارکت در پلتفرم",
      guidelines: [
        "پروژه جدید در 30 روز گذشته: 4 امتیاز",
        "نظر جدید در 60 روز گذشته: 3 امتیاز",
        "ورود منظم به پنل: 3 امتیاز",
        "این قابلیت در حال توسعه است و به زودی در دسترس خواهد بود",
      ],
      icon: <StarIcon className="w-6 h-6 text-indigo-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            امتیاز من
          </h1>
          <p className="text-brand-medium-blue">
            بررسی امتیاز و راهنمای بهبود رتبه در کیستی
          </p>
        </div>

        {/* Total Score Card */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 font-display">امتیاز کلی</h2>
              <div className="text-6xl font-bold mb-2">{Math.round(finalTotalScore)}</div>
              <p className="text-lg text-white/90">از 100 امتیاز</p>
            </div>
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <StarIcon className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Penalties Alert */}
        {penalties > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">جریمه‌ها</h3>
                <p className="text-sm text-red-700">
                  از امتیاز شما {penalties} امتیاز کسر شده است.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-red-700">
                  {penalties >= 30 && (
                    <li>• میانگین امتیاز زیر 2 ستاره: -30 امتیاز</li>
                  )}
                  {penalties >= 20 && penalties < 30 && (
                    <li>• پاسخگویی کمتر از 50%: -20 امتیاز</li>
                  )}
                  {penalties >= 40 && (
                    <li>• عدم فعالیت بیش از 90 روز: -40 امتیاز</li>
                  )}
                  {penalties >= 50 && (
                    <li>• گزارش تخلف تأییدشده: -50 امتیاز</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Factors Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
            جزئیات امتیاز
          </h2>
          <div className="space-y-4">
            {factors.map((factor, index) => (
              <FactorCard key={index} {...factor} />
            ))}
          </div>
        </div>

        {/* Guidelines Section */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display">
            راهنمای کلی بهبود امتیاز
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-brand-dark-blue mb-2">
                فرمول نهایی امتیاز:
              </h3>
              <p className="text-brand-medium-blue">
                امتیاز کلی = مجموع امتیازهای پایه - جریمه‌ها
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-brand-dark-blue mb-2">
                ترتیب نمایش نتایج:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-brand-medium-blue">
                <li>تولیدکنندگان پریمیوم (بر اساس سطح)</li>
                <li>تولیدکنندگان با امتیاز بالا (غیرپریمیوم)</li>
                <li>سایر تولیدکنندگان (بر اساس امتیاز)</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-brand-dark-blue mb-2">
                نکات مهم:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-brand-medium-blue">
                <li>
                  حداکثر امتیاز قابل کسب: 100 امتیاز
                </li>
                <li>
                  برخی قابلیت‌ها در حال توسعه هستند و به زودی در دسترس قرار
                  خواهند گرفت
                </li>
                <li>
                  نظرات بر اساس پروژه‌های تکمیل شده محاسبه می‌شوند
                </li>
                <li>
                  برای بهبود امتیاز، پروفایل خود را کامل کنید و پروژه‌های
                  باکیفیت انجام دهید
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link href="/dashboard/supplier/profile">
            <button className="px-6 py-3 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue transition-colors font-medium">
              تکمیل پروفایل
            </button>
          </Link>
          <Link href="/dashboard/supplier/portfolio">
            <button className="px-6 py-3 bg-brand-light-sky text-brand-medium-blue rounded-lg hover:bg-brand-medium-blue hover:text-white transition-colors font-medium border border-brand-medium-gray">
              افزودن نمونه کار
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

