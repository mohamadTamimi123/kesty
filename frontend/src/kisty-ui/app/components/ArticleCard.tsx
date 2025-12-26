"use client";

import Link from "next/link";
import Image from "next/image";
import { EducationalArticle } from "../types/article";

interface ArticleCardProps {
  article: EducationalArticle;
}

export default function ArticleCard({ article }: ArticleCardProps) {
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

  return (
    <Link href={`/education/${article.slug}`}>
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
        {article.featuredImage && (
          <div className="relative w-full h-48 bg-brand-light-gray">
            <Image
              src={getImageUrl(article.featuredImage) || "/placeholder-article.png"}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              unoptimized
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2 text-sm text-brand-medium-gray">
            {article.category && (
              <span className="px-2 py-1 bg-brand-light-sky rounded text-xs">
                {article.category.title}
              </span>
            )}
            {article.publishedAt && (
              <span>{formatDate(article.publishedAt)}</span>
            )}
            <span className="mr-auto">👁 {article.viewCount}</span>
          </div>
          <h3 className="text-xl font-bold text-brand-dark-blue mb-2 font-display group-hover:text-brand-medium-blue transition-colors line-clamp-2">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-brand-medium-blue line-clamp-3 mb-4">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-medium-blue hover:text-brand-dark-blue transition-colors">
              مطالعه بیشتر →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

