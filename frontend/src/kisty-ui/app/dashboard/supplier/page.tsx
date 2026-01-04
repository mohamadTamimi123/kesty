"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import StatsCard from "../../components/StatsCard";
import WorkflowCard from "../../components/WorkflowCard";
import { Project, ProjectStatus } from "../../types/project";
import { Quote, QuoteStatus } from "../../types/quote";
import { SupplierRating } from "../../types/rating";
import apiClient from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";
import toast from "react-hot-toast";
import logger from "../../utils/logger";
import { calculateProfileCompletion } from "../../utils/profile";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  LinkIcon,
  ShareIcon,
  FolderIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function SupplierDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { unreadCount, openChatModal } = useChat();
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [relevantProjects, setRelevantProjects] = useState<Project[]>([]);
  const [supplierCategories, setSupplierCategories] = useState<string[]>([]);
  const [supplierCities, setSupplierCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [stats, setStats] = useState({
    newRequests: 0,
    activeProjects: 0,
    newMessages: 0,
    profileComplete: 0,
    totalPortfolios: 0,
    reviewRequests: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    rejectedQuotes: 0,
    acceptanceRate: 0,
  });
  const [profileData, setProfileData] = useState<any>(null);
  const [publicProfileUrl, setPublicProfileUrl] = useState<string>("");
  const [rating, setRating] = useState<SupplierRating | null>(null);

  // Generate slug from text - memoized
  const generateSlug = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, []);

  // Fetch dashboard data with useCallback to prevent infinite loops
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setIsLoading(true);
      
      // Step 1: Fetch essential data in parallel (profile, categories, cities)
      const [profileResult, categoriesResult, citiesResult] = await Promise.allSettled([
        apiClient.getMyProfile().catch(() => null),
        apiClient.getSupplierCategories(user.id).catch(() => []),
        apiClient.getSupplierCities(user.id).catch(() => []),
      ]);

      // Process profile data
      let profile: any = null;
      if (profileResult.status === 'fulfilled' && profileResult.value) {
        profile = profileResult.value;
        setProfileData(profile);
        const completion = calculateProfileCompletion(profile);
        setStats((prev) => ({ ...prev, profileComplete: completion }));
        
        const slug = generateSlug(profile.workshopName || profile.fullName || "");
        if (slug) {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          setPublicProfileUrl(`${baseUrl}/supplier/${slug}`);
        }
      } else if (user) {
        // Fallback to user from context
        const completion = calculateProfileCompletion(user);
        setStats((prev) => ({ ...prev, profileComplete: completion }));
        
        const slug = generateSlug((user as any).workshopName || user.name || "");
        if (slug) {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          setPublicProfileUrl(`${baseUrl}/supplier/${slug}`);
        }
      }

      // Process categories and cities
      let supplierCategoryIds: string[] = [];
      let supplierSubCategoryIds: string[] = [];
      let supplierCityIds: string[] = [];
      
      if (categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value)) {
        categoriesResult.value.forEach((cat: any) => {
          const categoryId = String(cat.id || cat);
          if (categoryId && !supplierCategoryIds.includes(categoryId)) {
            supplierCategoryIds.push(categoryId);
          }
          if (cat.subcategories && Array.isArray(cat.subcategories)) {
            cat.subcategories.forEach((subCat: any) => {
              const subCategoryId = String(subCat.id || subCat);
              if (subCategoryId && !supplierSubCategoryIds.includes(subCategoryId)) {
                supplierSubCategoryIds.push(subCategoryId);
              }
            });
          }
        });
      }
      
      if (citiesResult.status === 'fulfilled' && Array.isArray(citiesResult.value)) {
        supplierCityIds = citiesResult.value.map((city: any) => String(city.id || city)).filter(Boolean);
      }
      
      setSupplierCategories(supplierCategoryIds);
      setSupplierCities(supplierCityIds);

      // Step 2: Fetch projects (critical for initial view)
      setIsLoadingProjects(true);
      let projectsCount = 0;
      try {
        // Use pagination - fetch 10 projects for initial view
        const projectsResponse = await apiClient.getRelevantProjectsForSupplier(
          supplierCategoryIds,
          supplierCityIds,
          supplierSubCategoryIds,
          10, // Fetch 10 projects
          1, // Page 1
        );
        
        // Handle both paginated response and legacy array response
        const allProjects = Array.isArray(projectsResponse) 
          ? projectsResponse 
          : (projectsResponse as any)?.data || [];
        
        const uniqueProjects = allProjects.filter((project: Project, index: number, self: Project[]) =>
          index === self.findIndex((p) => p.id === project.id)
        );
        
        projectsCount = Array.isArray(projectsResponse) 
          ? uniqueProjects.length 
          : (projectsResponse as any)?.total || uniqueProjects.length;
        
        setPublicProjects(uniqueProjects.slice(0, 5));
        setRelevantProjects(uniqueProjects.slice(0, 10));
      } catch (error: unknown) {
        logger.error("Error fetching projects", error);
        setRelevantProjects([]);
        setPublicProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }

      // Step 3: Fetch non-critical data in parallel (rating, quotes, stats)
      // These can load after initial render
      Promise.allSettled([
        // Supplier rating
        apiClient.getSupplierRating(user.id)
          .then((supplierRating) => {
            logger.info("Supplier rating fetched:", supplierRating);
            setRating(supplierRating);
          })
          .catch((error) => {
            logger.error("Error fetching supplier rating", error);
            setRating(null);
          }),
        
        // Quotes stats - always fetch to get complete stats
        apiClient.getMyQuotes()
          .then((quotes) => {
            const quotesArray = Array.isArray(quotes) ? quotes : [];
            const totalQuotes = quotesArray.length;
            const pendingQuotes = quotesArray.filter((q: Quote) => q.status === QuoteStatus.PENDING).length;
            const acceptedQuotes = quotesArray.filter((q: Quote) => q.status === QuoteStatus.ACCEPTED).length;
            const rejectedQuotes = quotesArray.filter((q: Quote) => q.status === QuoteStatus.REJECTED).length;
            const acceptanceRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
            
            logger.info("Quotes stats:", { totalQuotes, pendingQuotes, acceptedQuotes, rejectedQuotes, acceptanceRate });
            
            setStats((prev) => ({
              ...prev,
              totalQuotes,
              pendingQuotes,
              acceptedQuotes,
              rejectedQuotes,
              acceptanceRate,
            }));
          })
          .catch((error) => {
            logger.error("Error fetching quotes", error);
            // Set default values
            setStats((prev) => ({
              ...prev,
              totalQuotes: 0,
              pendingQuotes: 0,
              acceptedQuotes: 0,
              rejectedQuotes: 0,
              acceptanceRate: 0,
            }));
          }),
        
        // Portfolios - always fetch
        apiClient.getMyPortfolios()
          .then((portfolios) => {
            const portfoliosArray = Array.isArray(portfolios) ? portfolios : [];
            const portfolioCount = portfoliosArray.length;
            logger.info("Portfolios fetched:", portfolioCount);
            setStats((prev) => ({
              ...prev,
              totalPortfolios: portfolioCount,
            }));
          })
          .catch((error) => {
            logger.error("Error fetching portfolios", error);
            setStats((prev) => ({
              ...prev,
              totalPortfolios: 0,
            }));
          }),
        
        // Review requests - always fetch
        apiClient.getSupplierReviewRequests()
          .then((reviewRequests) => {
            const reviewRequestsArray = Array.isArray(reviewRequests) ? reviewRequests : [];
            const reviewRequestsCount = reviewRequestsArray.length;
            logger.info("Review requests fetched:", reviewRequestsCount);
            setStats((prev) => ({
              ...prev,
              reviewRequests: reviewRequestsCount,
            }));
          })
          .catch((error) => {
            logger.error("Error fetching review requests", error);
            setStats((prev) => ({
              ...prev,
              reviewRequests: 0,
            }));
          }),
        
        // Supplier stats with fallback
        apiClient.getSupplierStats()
          .then((supplierStats) => {
            logger.info("Supplier stats fetched:", supplierStats);
            setStats((prev) => ({
              ...prev,
              newRequests: supplierStats.newRequests || projectsCount,
              activeProjects: supplierStats.activeProjects || 0,
              newMessages: supplierStats.newMessages || unreadCount || 0,
              // Don't override portfolios if already set
              totalPortfolios: prev.totalPortfolios || supplierStats.totalPortfolios || 0,
            }));
          })
          .catch(async (error: any) => {
            if (error?.response?.status !== 404) {
              logger.error("Error fetching supplier stats", error);
            }
            // Fallback: use projects count
            logger.info("Using fallback stats with projects count:", projectsCount);
            setStats((prev) => ({
              ...prev,
              newRequests: projectsCount,
              newMessages: unreadCount || 0,
            }));
          }),
      ]);

      // Mark initial loading as complete (non-critical data can continue loading)
      setIsLoading(false);
    } catch (error: unknown) {
      logger.error("Error fetching dashboard data", error);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, unreadCount]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user?.id, fetchDashboardData]);

  // Memoize expensive computations
  const displayProjects = useMemo(() => relevantProjects.slice(0, 10), [relevantProjects]);
  const displayPublicProjects = useMemo(() => publicProjects.slice(0, 5), [publicProjects]);
  const profileCompletionPercentage = useMemo(() => stats.profileComplete, [stats.profileComplete]);
  const hasIncompleteProfile = useMemo(() => profileCompletionPercentage < 100, [profileCompletionPercentage]);

  if (isLoading || authLoading) {
    return <LoadingSpinner size="lg" text="در حال بارگذاری اطلاعات..." />;
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<BuildingOfficeIcon className="w-16 h-16 text-brand-medium-gray" />}
        title="لطفاً وارد شوید"
        description="برای مشاهده داشبورد خود، لطفاً وارد حساب کاربری شوید."
        actionLabel="ورود به حساب کاربری"
        actionHref="/login"
      />
    );
  }

  return (
    <div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            خوش آمدید {user?.fullName || user?.name || "تولیدکننده عزیز"}!
          </h1>
          <p className="text-brand-medium-blue">
            مدیریت پروژه‌ها و پروفایل کارگاه
          </p>
        </div>

        {/* Rating Card */}
        {rating && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-md p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2 font-display">رتبه شما</h3>
                <div className="text-4xl font-bold mb-1">{Math.round(rating.totalScore)}</div>
                <p className="text-sm text-white/90">از 100 امتیاز</p>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <StarIcon className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<ClockIcon className="w-6 h-6" />}
            value={stats.newRequests}
            label="درخواست‌های جدید"
            subtitle={stats.newRequests > 0 ? "مشاهده همه پروژه‌ها" : "هنوز درخواستی وجود ندارد"}
            onClick={() => router.push("/dashboard/supplier/projects")}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />

          <StatsCard
            icon={<DocumentTextIcon className="w-6 h-6" />}
            value={stats.totalQuotes}
            label="پیشنهادات ارسال شده"
            subtitle={
              stats.totalQuotes > 0
                ? `${stats.pendingQuotes} در انتظار • ${stats.acceptedQuotes} پذیرفته شده`
                : "هنوز پیشنهادی ارسال نشده"
            }
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />

          <StatsCard
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
            value={unreadCount > 0 ? unreadCount : stats.newMessages}
            label="پیام‌های جدید"
            onClick={() => openChatModal()}
            iconBgColor={unreadCount > 0 ? "bg-blue-100" : "bg-brand-light-sky"}
            iconColor={unreadCount > 0 ? "text-blue-600" : "text-brand-medium-blue"}
            valueColor={unreadCount > 0 ? "text-blue-600" : "text-brand-dark-blue"}
            badge={
              unreadCount > 0 ? (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : undefined
            }
          />

          <StatsCard
            icon={<CheckCircleIcon className="w-6 h-6" />}
            value={`${stats.profileComplete}%`}
            label="تکمیل پروفایل"
            subtitle={
              stats.profileComplete < 100
                ? `${100 - stats.profileComplete}% باقی مانده`
                : "پروفایل کامل است"
            }
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            subtitleClassName={stats.profileComplete < 100 ? "text-yellow-600" : "text-green-600"}
          />
        </div>

        {/* Profile Completion Alert */}
        {hasIncompleteProfile && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  پروفایل شما ناقص است
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  برای دریافت درخواست‌های بیشتر، پروفایل کارگاه خود را تکمیل کنید.
                </p>
                <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats.profileComplete}%` }}
                  />
                </div>
                <Link href="/dashboard/supplier/profile">
                  <Button variant="primary" size="sm">
                    تکمیل پروفایل
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Public Profile Link */}
        {publicProfileUrl && (
          <div className="bg-gradient-to-r from-brand-medium-blue to-brand-dark-blue rounded-lg shadow-md p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 font-display">
                  پروفایل عمومی شما
                </h3>
                <p className="text-sm text-white/90 mb-3">
                  لینک پروفایل عمومی کارگاه شما برای به‌اشتراک‌گذاری
                </p>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mb-3">
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-sm font-mono break-all">{publicProfileUrl}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicProfileUrl);
                      toast.success("لینک کپی شد");
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    کپی لینک
                  </button>
                  <Link
                    href={publicProfileUrl}
                    target="_blank"
                    className="px-4 py-2 bg-white text-brand-medium-blue hover:bg-white/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <ShareIcon className="w-4 h-4" />
                    مشاهده پروفایل
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View All Projects - Prominent Card */}
        <Link href="/dashboard/supplier/projects">
          <div className="bg-gradient-to-r from-brand-medium-blue to-brand-dark-blue rounded-lg shadow-md p-6 mb-8 text-white hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1 font-display">
                  مشاهده همه پروژه‌ها
                </h3>
                <p className="text-sm text-white/90">
                  {stats.newRequests > 0 
                    ? `${stats.newRequests} پروژه مرتبط با تخصص شما` 
                    : "مشاهده و ارسال پیشنهاد برای پروژه‌های موجود"}
                </p>
              </div>
              <ArrowRightIcon className="w-6 h-6 text-white group-hover:translate-x-[-4px] transition-transform" />
            </div>
          </div>
        </Link>

        {/* Workflow Cards - Horizontal Flow */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-brand-dark-blue font-display mb-6">
            مسیر کاری شما
          </h2>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch">
            {/* Card 1: مدیریت پروفایل کارگاه */}
            <div className="flex-1">
              <WorkflowCard
                icon={<BuildingOfficeIcon className="w-8 h-8" />}
                title="مدیریت پروفایل کارگاه"
                description="تکمیل اطلاعات کارگاه و تخصص‌ها"
                href="/dashboard/supplier/profile"
                iconBgColor="bg-brand-light-sky"
                iconColor="text-brand-medium-blue"
                showArrow={true}
              />
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <ArrowLeftIcon className="w-6 h-6 text-brand-medium-blue" />
            </div>

            {/* Card 2: مدیریت پیشنهادات */}
            <div className="flex-1">
              <WorkflowCard
                icon={<DocumentTextIcon className="w-8 h-8" />}
                title="مدیریت پیشنهادات"
                description={`${stats.totalQuotes} پیشنهاد • ${stats.acceptanceRate}% نرخ پذیرش`}
                href="/dashboard/supplier/quotes"
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                showArrow={true}
              />
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <ArrowLeftIcon className="w-6 h-6 text-brand-medium-blue" />
            </div>

            {/* Card 3: درخواست‌های نظر */}
            <div className="flex-1">
              <WorkflowCard
                icon={<StarIcon className="w-8 h-8" />}
                title="درخواست‌های نظر"
                description={`${stats.reviewRequests} درخواست`}
                href="/dashboard/supplier/reviews/requests"
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                showArrow={true}
              />
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <ArrowLeftIcon className="w-6 h-6 text-brand-medium-blue" />
            </div>

            {/* Card 4: نمونه کارها */}
            <div className="flex-1">
              <WorkflowCard
                icon={<FolderIcon className="w-8 h-8" />}
                title="نمونه کارها"
                description={`${stats.totalPortfolios} نمونه کار`}
                href="/dashboard/supplier/portfolio"
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                showArrow={false}
              />
            </div>
          </div>
        </div>

        {/* Related Projects */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="p-6 border-b border-brand-medium-gray">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-brand-dark-blue font-display">
                درخواست‌های مرتبط
              </h2>
              <Link
                href="/dashboard/supplier/projects"
                className="text-sm text-brand-medium-blue hover:text-brand-dark-blue flex items-center gap-1 font-medium"
              >
                مشاهده همه {relevantProjects.length > 0 && `(${relevantProjects.length})`}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-brand-medium-gray">
            {isLoadingProjects ? (
              <div className="p-12 text-center">
                <LoadingSpinner size="md" text="در حال بارگذاری پروژه‌های مرتبط..." />
              </div>
            ) : relevantProjects.length === 0 ? (
              <EmptyState
                icon={<DocumentTextIcon className="w-16 h-16 text-brand-medium-gray" />}
                title="در حال حاضر درخواستی مرتبط با تخصص شما وجود ندارد"
                description={
                  supplierCategories.length === 0 && supplierCities.length === 0
                    ? "لطفاً دسته‌بندی‌ها و شهرهای کاری خود را در پروفایل تکمیل کنید تا درخواست‌های مرتبط را دریافت کنید."
                    : "پروفایل خود را تکمیل کنید تا درخواست‌های بیشتری دریافت کنید"
                }
                actionLabel="تکمیل پروفایل"
                actionHref="/dashboard/supplier/profile"
              />
            ) : (
              displayProjects.map((project) => (
                <div
                  key={project.id}
                  className="block p-6 hover:bg-brand-off-white transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/supplier/projects/${project.id}/quote`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-brand-dark-blue">
                          {project.title}
                        </h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300">
                          جدید
                        </span>
                      </div>
                      <p className="text-sm text-brand-medium-blue line-clamp-2 mb-3">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-brand-medium-blue">
                        {project.city && (
                          <span className="flex items-center gap-1">
                            📍 {project.city.title}
                          </span>
                        )}
                        {project.category && (
                          <span className="flex items-center gap-1">
                            🏷️ {project.category.title}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          📅 {formatDate(project.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mr-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/supplier/projects/${project.id}/quote`);
                        }}
                      >
                        مشاهده و پاسخ
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  );
}
