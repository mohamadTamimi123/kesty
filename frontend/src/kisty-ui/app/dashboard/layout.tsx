"use client";

import { ReactNode, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirect based on role after login
  useEffect(() => {
    if (isAuthenticated && user) {
      const currentPath = window.location.pathname;
      const role = user.role?.toLowerCase();
      
      // If user is on /dashboard, redirect to their specific dashboard
      if (currentPath === "/dashboard") {
        if (role === "admin") {
          router.push("/dashboard/admin");
        } else if (role === "supplier") {
          router.push("/dashboard/supplier");
        } else {
          router.push("/dashboard/customer");
        }
      }
    }
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-medium-blue mx-auto"></div>
          <p className="mt-4 text-brand-medium-blue">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)] w-full lg:w-auto">
          {/* Mobile Menu Toggle - Only show when sidebar is closed */}
          <div className="lg:hidden bg-white border-b border-brand-medium-gray px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              aria-label="باز کردن منو"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Dashboard Header */}
          <DashboardHeader />
          
          {/* Page Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

