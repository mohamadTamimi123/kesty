"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MobileLayout from "../../components/MobileLayout";
import { EducationalArticle } from "../../types/article";
import { Category } from "../../types/category";
import apiClient from "../../lib/api";
import logger from "../../utils/logger";
import { ClockIcon, EyeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, "");
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

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

export default function CategoryArticlesPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.categorySlug as string;
  const [articles, setArticles] = useState<EducationalArticle[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch category by slug
        const categories = await apiClient.getActiveCategories();
        const foundCategory = Array.isArray(categories)
          ? categories.find((cat) => cat.slug === categorySlug)
          : null;
        
        if (foundCategory) {
          setCategory(foundCategory);
          // Fetch articles by category
          const articlesData = await apiClient.getArticlesByCategory(foundCategory.id);
          setArticles(Array.isArray(articlesData) ? articlesData.filter(a => a.isPublished) : []);
        } else {
          // If category not found, try to fetch all articles and filter
          const allArticles = await apiClient.getEducationalArticles(true);
          setArticles(Array.isArray(allArticles) ? allArticles : []);
        }
      } catch (error) {
        logger.error("Error fetching category articles", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (categorySlug) {
      fetchData();
    }
  }, [categorySlug]);

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">در حال بارگذاری...</div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center gap-2 text-sm text-brand-medium-blue">
            <Link href="/" className="hover:text-brand-dark-blue">
              خانه
            </Link>
            <span>/</span>
            <Link href="/expertguides" className="hover:text-brand-dark-blue">
              راهنمای متخصصین
            </Link>
            {category && (
              <>
                <span>/</span>
                <span className="text-brand-dark-blue">{category.title}</span>
              </>
            )}
          </div>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            بازگشت
          </button>
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-4">
            {category ? `مقالات ${category.title}` : "مقالات"}
          </h1>
          {category && (
            <p className="text-brand-medium-blue text-lg">
              {articles.length} مقاله در این دسته‌بندی
            </p>
          )}
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brand-medium-blue">مقاله‌ای در این دسته‌بندی یافت نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => {
              const imageUrl = getImageUrl(article.featuredImage);
              const readingTime = calculateReadingTime(article.content);
              const articleLink = `/expertguides/${categorySlug}/${article.slug}`;

              return (
                <Link
                  key={article.id}
                  href={articleLink}
                  className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                >
                  {imageUrl && (
                    <div className="relative w-full h-48">
                      <Image
                        src={imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-brand-dark-blue mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-brand-medium-blue mb-4 line-clamp-3 flex-grow">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-brand-medium-gray mt-auto">
                      <div className="flex items-center gap-4">
                        {article.publishedAt && (
                          <span>
                            {new Intl.DateTimeFormat("fa-IR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }).format(new Date(article.publishedAt))}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{readingTime} دقیقه</span>
                        </div>
                      </div>
                      {article.viewCount > 0 && (
                        <div className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>{new Intl.NumberFormat("fa-IR").format(article.viewCount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

