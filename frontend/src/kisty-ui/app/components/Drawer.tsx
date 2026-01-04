"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { Category } from "../types/category";
import { City } from "../types/city";
import apiClient from "../lib/api";
import logger from "../utils/logger";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export default function Drawer({ isOpen, onClose, children }: DrawerProps) {
  const { isAuthenticated, user } = useAuth();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [categoriesData, citiesData] = await Promise.all([
            apiClient.getActiveCategories(),
            apiClient.getActiveCities(),
          ]);
          // Get main categories (parent categories)
          const mainCategories = categoriesData.filter(
            (cat: Category) => !cat.parentId
          );
          setCategories(mainCategories.slice(0, 5));
          setCities(citiesData.slice(0, 15));
        } catch (error) {
          logger.error("Error fetching menu data", error);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-brand-medium-gray">
            <Link href="/" className="flex items-center" onClick={onClose}>
              <Image
                src="/keesti logo.png"
                alt="Keesti Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-brand-light-sky transition-colors"
              aria-label="بستن منو"
            >
              <svg
                className="w-6 h-6 text-brand-dark-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Guest User Menu */}
              {!isAuthenticated && (
                <>
                  <Link
                    href="/"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    خانه
                  </Link>

                  {/* Industries Menu */}
                  <div>
                    <button
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                    >
                      <span>صنایع قطعه‌سازی</span>
                      {categoriesOpen ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </button>
                    {categoriesOpen && (
                      <div className="mr-4 mt-2 space-y-1">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/category/${category.slug}`}
                            onClick={onClose}
                            className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                          >
                            {category.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cities Menu */}
                  <div>
                    <button
                      onClick={() => setCitiesOpen(!citiesOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                    >
                      <span>شهرها</span>
                      {citiesOpen ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </button>
                    {citiesOpen && (
                      <div className="mr-4 mt-2 space-y-1 max-h-64 overflow-y-auto">
                        {cities.map((city) => (
                          <Link
                            key={city.id}
                            href={`/city/${city.slug}`}
                            onClick={onClose}
                            className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                          >
                            {city.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/register?role=customer"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    ثبت درخواست پروژه
                  </Link>

                  <Link
                    href="/education"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    دانشنامه تخصصی تولید
                  </Link>

                  <Link
                    href="/machinery-market"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    بازارگاه ماشین‌آلات
                  </Link>

                  {/* Help & Support Submenu */}
                  <div>
                    <button
                      onClick={() => {}}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                    >
                      <span>راهنما و پشتیبانی</span>
                      <ChevronDownIcon className="w-5 h-5" />
                    </button>
                    <div className="mr-4 mt-2 space-y-1">
                      <Link
                        href="/about"
                        onClick={onClose}
                        className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                      >
                        درباره ما
                      </Link>
                      <Link
                        href="/faq"
                        onClick={onClose}
                        className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                      >
                        سوالات متداول (FAQ)
                      </Link>
                      <Link
                        href="/contact"
                        onClick={onClose}
                        className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                      >
                        تماس با ما
                      </Link>
                    </div>
                  </div>

                  <Link
                    href="/changelog"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    Changelog
                  </Link>
                </>
              )}

              {/* Authenticated User Menu */}
              {isAuthenticated && (
                <>
                  <Link
                    href={`/dashboard/${user?.role || "customer"}`}
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    پروفایل من
                  </Link>
                  {user?.role === "customer" && (
                    <Link
                      href="/dashboard/customer/projects"
                      onClick={onClose}
                      className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                    >
                      درخواست‌های من
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/${user?.role || "customer"}/messages`}
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    پیام‌های من
                  </Link>
                  {user?.role === "customer" && (
                    <Link
                      href="/dashboard/customer/projects/create"
                      onClick={onClose}
                      className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                    >
                      ثبت درخواست جدید
                    </Link>
                  )}

                  {/* Industries Menu */}
                  <div>
                    <button
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                    >
                      <span>صنایع قطعه‌سازی</span>
                      {categoriesOpen ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </button>
                    {categoriesOpen && (
                      <div className="mr-4 mt-2 space-y-1">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/category/${category.slug}`}
                            onClick={onClose}
                            className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                          >
                            {category.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cities Menu */}
                  <div>
                    <button
                      onClick={() => setCitiesOpen(!citiesOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                    >
                      <span>شهرها</span>
                      {citiesOpen ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </button>
                    {citiesOpen && (
                      <div className="mr-4 mt-2 space-y-1 max-h-64 overflow-y-auto">
                        {cities.map((city) => (
                          <Link
                            key={city.id}
                            href={`/city/${city.slug}`}
                            onClick={onClose}
                            className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                          >
                            {city.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/education"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    دانشنامه تخصصی تولید
                  </Link>

                  <Link
                    href="/machinery-market"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    بازارگاه ماشین‌آلات
                  </Link>

                  {/* Help & Support Submenu */}
                  <div>
                    <button
                      onClick={() => {}}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                    >
                      <span>راهنما و پشتیبانی</span>
                      <ChevronDownIcon className="w-5 h-5" />
                    </button>
                    <div className="mr-4 mt-2 space-y-1">
                      <Link
                        href="/about"
                        onClick={onClose}
                        className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                      >
                        درباره ما
                      </Link>
                      <Link
                        href="/faq"
                        onClick={onClose}
                        className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                      >
                        سوالات متداول (FAQ)
                      </Link>
                      <Link
                        href="/contact"
                        onClick={onClose}
                        className="block px-4 py-2 rounded-lg text-sm text-brand-medium-blue hover:bg-brand-light-sky transition-colors"
                      >
                        تماس با ما
                      </Link>
                    </div>
                  </div>

                  <Link
                    href="/changelog"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium"
                  >
                    Changelog
                  </Link>
                </>
              )}
            </div>

            {/* Auth Buttons for Guest */}
            {!isAuthenticated && (
              <div className="mt-6 pt-6 border-t border-brand-medium-gray space-y-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="block w-full px-4 py-3 rounded-lg text-center text-brand-dark-blue hover:bg-brand-light-sky transition-colors font-medium border border-brand-medium-gray"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="block w-full px-4 py-3 rounded-full text-center bg-brand-medium-blue text-white hover:bg-brand-dark-blue transition-colors font-medium shadow-md"
                >
                  ثبت نام
                </Link>
              </div>
            )}

            {children}
          </nav>
        </div>
      </div>
    </>
  );
}
