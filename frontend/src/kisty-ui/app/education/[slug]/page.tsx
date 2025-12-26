"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Breadcrumb, { BreadcrumbItem } from "../../../components/Breadcrumb";
import { EducationalArticle } from "../../../types/article";
import apiClient from "../../../lib/api";
import toast from "react-hot-toast";

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<EducationalArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const articleData = await apiClient.getEducationalArticleBySlug(slug);
        setArticle(articleData);
      } catch (error: any) {
        console.error("Error fetching article:", error);
        toast.error("خطا در دریافت مقاله");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    const apiUrl =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3000", ":3001")
        : "http://localhost:3001";
    const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${apiUrl}/api${path}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-medium-blue">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-dark-blue">مقاله یافت نشد</div>
        </div>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "خانه", href: "/" },
    { label: "دانشنامه", href: "/education" },
    { label: article.title },
  ];

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Article Header */}
        <article className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-8 md:p-12">
          {/* Featured Image */}
          {article.featuredImage && (
            <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={getImageUrl(article.featuredImage) || "/placeholder-article.png"}
                alt={article.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-blue mb-4 font-display">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-brand-medium-gray border-b border-brand-medium-gray pb-4">
            {article.category && (
              <span className="px-3 py-1 bg-brand-light-sky rounded">
                {article.category.title}
              </span>
            )}
            {article.publishedAt && (
              <span>📅 {formatDate(article.publishedAt)}</span>
            )}
            <span>👁 {article.viewCount} بازدید</span>
            {article.author && (
              <span>✍️ {article.author.name}</span>
            )}
          </div>

          {/* Excerpt */}
          {article.excerpt && (
            <div className="bg-brand-light-sky rounded-lg p-4 mb-6">
              <p className="text-lg text-brand-dark-blue font-medium">{article.excerpt}</p>
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none text-brand-medium-blue leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* Related Articles Section - Placeholder */}
        <div className="mt-12 bg-white rounded-lg shadow-md border border-brand-medium-gray p-8">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display">
            مقالات مرتبط
          </h2>
          <p className="text-brand-medium-blue">
            مقالات مرتبط به زودی اضافه خواهند شد
          </p>
        </div>
      </div>
    </div>
  );
}

