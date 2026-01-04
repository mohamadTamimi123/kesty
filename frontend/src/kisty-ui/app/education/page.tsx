"use client";

import { useState, useEffect } from "react";
import ArticleCard from "../components/ArticleCard";
import { EducationalArticle } from "../types/article";
import { Category } from "../types/category";
import apiClient from "../lib/api";
import toast from "react-hot-toast";
import logger from "../utils/logger";

export default function EducationPage() {
  const [latestArticles, setLatestArticles] = useState<EducationalArticle[]>([]);
  const [popularArticles, setPopularArticles] = useState<EducationalArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categoryArticles, setCategoryArticles] = useState<EducationalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [articles, popular, categoriesData] = await Promise.all([
          apiClient.getEducationalArticles(true),
          apiClient.getPopularArticles(5),
          apiClient.getActiveCategories(),
        ]);

        setLatestArticles(articles.slice(0, 6));
        setPopularArticles(popular);
        setCategories(categoriesData.filter((cat: Category) => !cat.parentId));
      } catch (error: unknown) {
        logger.error("Error fetching articles", error);
        toast.error("خطا در دریافت مقالات");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const fetchCategoryArticles = async () => {
        try {
          const articles = await apiClient.getArticlesByCategory(selectedCategory);
          setCategoryArticles(articles);
        } catch (error: unknown) {
          logger.error("Error fetching category articles", error);
          toast.error("خطا در دریافت مقالات دسته‌بندی");
        }
      };
      fetchCategoryArticles();
    } else {
      setCategoryArticles([]);
    }
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-dark-blue mb-4 font-display">
            دانشنامه تخصصی تولید
          </h1>
          <p className="text-lg text-brand-medium-blue">
            مرجع آموزشی برای جذب ترافیک ارگانیک و افزایش تعامل کاربران
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === ""
                  ? "bg-brand-medium-blue text-white"
                  : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-brand-light-sky"
              }`}
            >
              همه مقالات
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-brand-medium-blue text-white"
                    : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-brand-light-sky"
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        ) : (
          <>
            {/* Category Articles */}
            {selectedCategory && categoryArticles.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                  مقالات دسته‌بندی انتخاب شده
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Latest Articles */}
            {!selectedCategory && latestArticles.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                  آخرین مقالات
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Popular Articles */}
            {!selectedCategory && popularArticles.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                  پربازدیدترین مقالات
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {(!selectedCategory || categoryArticles.length === 0) &&
              latestArticles.length === 0 && (
                <div className="bg-white rounded-lg border border-brand-medium-gray p-12 text-center">
                  <p className="text-brand-medium-blue">
                    هنوز مقاله‌ای منتشر نشده است
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

