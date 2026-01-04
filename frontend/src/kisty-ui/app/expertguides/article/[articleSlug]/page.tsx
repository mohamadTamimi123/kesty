"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MobileLayout from "../../../components/MobileLayout";
import { EducationalArticle } from "../../../types/article";
import apiClient from "../../../lib/api";
import logger from "../../../utils/logger";
import { ClockIcon, EyeIcon, ArrowLeftIcon, UserIcon } from "@heroicons/react/24/outline";

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

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleSlug = params.articleSlug as string;
  const [article, setArticle] = useState<EducationalArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<EducationalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        
        const articleData = await apiClient.getEducationalArticleBySlug(articleSlug);
        setArticle(articleData);

        try {
          await apiClient.updateEducationalArticle(articleData.id, {
            viewCount: (articleData.viewCount || 0) + 1,
          });
        } catch (error) {
          logger.error("Error updating view count", error);
        }

        if (articleData.categoryId) {
          const related = await apiClient.getArticlesByCategory(articleData.categoryId);
          const filtered = Array.isArray(related)
            ? related.filter((a) => a.id !== articleData.id && a.isPublished).slice(0, 3)
            : [];
          setRelatedArticles(filtered);
        }
      } catch (error) {
        logger.error("Error fetching article", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (articleSlug) {
      fetchArticle();
    }
  }, [articleSlug]);

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">در حال بارگذاری...</div>
        </div>
      </MobileLayout>
    );
  }

  if (!article) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-brand-medium-blue mb-4">مقاله یافت نشد</p>
            <Link
              href="/expertguides"
              className="text-brand-medium-blue hover:text-brand-dark-blue"
            >
              بازگشت به لیست مقالات
            </Link>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const imageUrl = getImageUrl(article.featuredImage);
  const readingTime = calculateReadingTime(article.content);
  const categorySlug = article.category?.slug || 'article';

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="mb-6">
          <div className="flex items-center gap-2 text-sm text-brand-medium-blue">
            <Link href="/" className="hover:text-brand-dark-blue">
              خانه
            </Link>
            <span>/</span>
            <Link href="/expertguides" className="hover:text-brand-dark-blue">
              راهنمای متخصصین
            </Link>
            {article.category && (
              <>
                <span>/</span>
                <Link
                  href={`/expertguides/${article.category.slug}`}
                  className="hover:text-brand-dark-blue"
                >
                  {article.category.title}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-brand-dark-blue">{article.title}</span>
          </div>
        </nav>

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brand-medium-blue hover:text-brand-dark-blue mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          بازگشت
        </button>

        <div className="mb-8">
          {article.category && (
            <span className="inline-block px-3 py-1 bg-brand-light-sky text-brand-medium-blue rounded-full text-sm mb-4">
              {article.category.title}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-blue font-display mb-4">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-brand-medium-gray mb-6">
            {article.author && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>{article.author.name}</span>
              </div>
            )}
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
              <span>{readingTime} دقیقه مطالعه</span>
            </div>
            {article.viewCount > 0 && (
              <div className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                <span>{new Intl.NumberFormat("fa-IR").format(article.viewCount)} بازدید</span>
              </div>
            )}
          </div>

          {imageUrl && (
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
              <Image
                src={imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>

        <div className="prose prose-lg max-w-none mb-12">
          {article.excerpt && (
            <div className="bg-brand-light-sky border-r-4 border-brand-medium-blue p-4 mb-8 rounded">
              <p className="text-brand-dark-blue text-lg font-medium">{article.excerpt}</p>
            </div>
          )}
          <div
            className="article-content text-brand-dark-blue"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {relatedArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-brand-medium-gray">
            <h2 className="text-2xl font-bold text-brand-dark-blue font-display mb-6">
              مقالات مرتبط
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map((relatedArticle) => {
                const relatedImageUrl = getImageUrl(relatedArticle.featuredImage);
                const relatedLink = relatedArticle.category?.slug
                  ? `/expertguides/${relatedArticle.category.slug}/${relatedArticle.slug}`
                  : `/expertguides/article/${relatedArticle.slug}`;

                return (
                  <Link
                    key={relatedArticle.id}
                    href={relatedLink}
                    className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {relatedImageUrl && (
                      <div className="relative w-full h-32">
                        <Image
                          src={relatedImageUrl}
                          alt={relatedArticle.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-brand-dark-blue line-clamp-2">
                        {relatedArticle.title}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

