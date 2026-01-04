"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Project, ProjectStatus } from "../../types/project";
import { City } from "../../types/city";
import { Category } from "../../types/category";
import apiClient from "../../lib/api";
import toast from "react-hot-toast";
import logger from "../../utils/logger";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import ProjectCard from "../../components/ProjectCard";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [projectsData, citiesData, categoriesData] = await Promise.all([
          apiClient.getPublicProjects(),
          apiClient.getActiveCities(),
          apiClient.getActiveCategories(),
        ]);
        const projectsList = Array.isArray(projectsData) ? projectsData : projectsData?.data || [];
        setProjects(projectsList);
        setCities(citiesData);
        setCategories(categoriesData);
      } catch (error: unknown) {
        logger.error("Error fetching data", error);
        toast.error((error as any)?.response?.data?.message || "خطا در دریافت اطلاعات");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = !cityFilter || project.cityId === cityFilter;
    const matchesCategory = !categoryFilter || project.categoryId === categoryFilter;
    return matchesSearch && matchesCity && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-medium-blue">
            در حال بارگذاری...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue mb-2 font-display">
            پروژه‌های فعال
          </h1>
          <p className="text-brand-medium-blue">
            مشاهده و شرکت در مناقصه پروژه‌های فعال
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-brand-medium-gray">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="جستجو در پروژه‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
              />
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue"
            >
              <option value="">همه شهرها</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.title}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue"
            >
              <option value="">همه دسته‌بندی‌ها</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center border border-brand-medium-gray">
              <p className="text-brand-medium-blue">
                پروژه‌ای یافت نشد
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

