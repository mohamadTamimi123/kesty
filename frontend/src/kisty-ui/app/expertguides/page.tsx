"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MobileLayout from "../components/MobileLayout";
import { EducationalArticle } from "../types/article";
import apiClient from "../lib/api";
import logger from "../utils/logger";
import { ClockIcon, EyeIcon } from "@heroicons/react/24/outline";

const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ""); // Remove HTML tags
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

export default function ExpertGuidesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<EducationalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getEducationalArticles(true); // Only published
        setArticles(Array.isArray(data) ? data : []);
      } catch (error) {
        logger.error("Error fetching articles", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(query)) ||
      (article.category?.title && article.category.title.toLowerCase().includes(query))
    );
  });

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-4">
            راهنمای متخصصین
          </h1>
          <p className="text-brand-medium-blue text-lg">
            مجموعه مقالات تخصصی در حوزه‌های صنعتی
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="جستجو در مقالات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
          />
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brand-medium-blue">مقاله‌ای یافت نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const imageUrl = getImageUrl(article.featuredImage);
              const readingTime = calculateReadingTime(article.content);
              const articleLink = article.category?.slug
                ? `/expertguides/${article.category.slug}/${article.slug}`
                : `/expertguides/article/${article.slug}`;

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
                    {article.category && (
                      <span className="text-xs text-brand-medium-blue mb-2">
                        {article.category.title}
                      </span>
                    )}
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

