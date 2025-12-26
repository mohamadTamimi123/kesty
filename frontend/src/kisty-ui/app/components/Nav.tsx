"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UserCircleIcon,
  Squares2X2Icon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import Drawer from "./Drawer";

export default function Nav() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  return (
    <nav className="w-full border-b border-brand-medium-gray bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-brand-light-sky transition-colors"
              aria-label="باز کردن منو"
            >
              <Bars3Icon className="w-6 h-6 text-brand-dark-blue" />
            </button>
            
            <Link href="/" className="flex items-center">
              <Image
                src="/keesti logo.png"
                alt="Keesti Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
            >
              خانه
            </Link>
            <Link 
              href="/brandbook" 
              className="text-sm font-medium text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
            >
              برند بوک
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
            >
              درباره ما
            </Link>
            <Link 
              href="/contact" 
              className="text-sm font-medium text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
            >
              تماس با ما
            </Link>
            <Link 
              href="/education" 
              className="text-sm font-medium text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
            >
              دانشنامه
            </Link>
            <Link 
              href="/machinery-market" 
              className="text-sm font-medium text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
            >
              بازارگاه
            </Link>
            <Link 
              href="/changelog" 
              className="text-sm font-medium text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
            >
              Changelog
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-brand-medium-gray hover:border-brand-medium-blue hover:shadow-md transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-light-sky flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-brand-medium-blue" />
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-brand-medium-blue transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-brand-medium-gray py-2 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-brand-medium-gray">
                      <p className="text-sm font-semibold text-brand-dark-blue">
                        {user?.name || "حساب کاربری"}
                      </p>
                      <p className="text-xs text-brand-medium-blue mt-1">
                        {user?.phone || "کاربر"}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/${user?.role || "customer"}`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-brand-dark-blue hover:bg-brand-light-sky transition-colors"
                    >
                      <Squares2X2Icon className="w-5 h-5 text-brand-medium-blue" />
                      <span>داشبورد</span>
                    </Link>

                    <Link
                      href={`/dashboard/${user?.role || "customer"}/profile`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-brand-dark-blue hover:bg-brand-light-sky transition-colors"
                    >
                      <UserIcon className="w-5 h-5 text-brand-medium-blue" />
                      <span>پروفایل</span>
                    </Link>

                    <div className="border-t border-brand-medium-gray my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span>خروج از حساب</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-full bg-brand-medium-blue text-white hover:bg-brand-dark-blue transition-colors shadow-md hover:shadow-lg"
                >
                  ثبت نام
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </nav>
  );
}

