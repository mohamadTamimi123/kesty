"use client";

import { ReactNode, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Sidebar from "../components/Sidebar";
import { ChatProvider } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// Lazy load ChatSidebar - not critical for initial page load
const ChatSidebar = dynamic(() => import("../components/ChatSidebar"), {
  ssr: false,
  loading: () => null, // Don't show loading indicator for chat sidebar
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastRedirectedPathRef = useRef<string>("");
  const isRedirectingRef = useRef(false);

  // Redirect based on role after login and protect routes
  // Only handle role-based redirects here, auth check is handled by middleware
  useEffect(() => {
    // Don't redirect if still loading or not authenticated (middleware handles this)
    if (isLoading || !isAuthenticated || !user) {
      return;
    }

    // Prevent redirect loops - don't redirect if already redirecting or if we're on the target path
    if (isRedirectingRef.current) {
      return;
    }

    // If we just redirected to this path, don't redirect again
    if (lastRedirectedPathRef.current === pathname) {
      // Reset after a short delay to allow for navigation completion
      const timer = setTimeout(() => {
        lastRedirectedPathRef.current = "";
      }, 200);
      return () => clearTimeout(timer);
    }

    const role = user.role?.toLowerCase();
    
    // Normalize role
    const normalizedRole = role === "customer" || role === "CUSTOMER" ? "customer" :
                          role === "supplier" || role === "SUPPLIER" ? "supplier" :
                          role === "admin" || role === "ADMIN" ? "admin" : null;

    if (!normalizedRole) {
      // Invalid role - redirect to login
      if (pathname !== "/login" && lastRedirectedPathRef.current !== "/login") {
        isRedirectingRef.current = true;
        lastRedirectedPathRef.current = "/login";
        router.replace("/login");
        setTimeout(() => {
          isRedirectingRef.current = false;
        }, 100);
      }
      return;
    }

    // If user is on /dashboard, redirect to their specific dashboard
    if (pathname === "/dashboard") {
      const targetPath = normalizedRole === "admin" 
        ? "/dashboard/admin" 
        : normalizedRole === "supplier" 
        ? "/dashboard/supplier" 
        : "/dashboard/customer";
      if (targetPath !== pathname && lastRedirectedPathRef.current !== targetPath) {
        isRedirectingRef.current = true;
        lastRedirectedPathRef.current = targetPath;
        router.replace(targetPath);
        setTimeout(() => {
          isRedirectingRef.current = false;
        }, 100);
      }
      return;
    }

    // Protect admin routes
    if (pathname.startsWith("/dashboard/admin")) {
      if (normalizedRole !== "admin") {
        const targetPath = normalizedRole === "supplier" 
          ? "/dashboard/supplier" 
          : "/dashboard/customer";
        if (targetPath !== pathname && lastRedirectedPathRef.current !== targetPath) {
          isRedirectingRef.current = true;
          lastRedirectedPathRef.current = targetPath;
          toast.error("شما دسترسی به این بخش را ندارید");
          router.replace(targetPath);
          setTimeout(() => {
            isRedirectingRef.current = false;
          }, 100);
        }
        return;
      }
    }

    // Protect customer routes
    if (pathname.startsWith("/dashboard/customer")) {
      if (normalizedRole !== "customer") {
        const targetPath = normalizedRole === "admin" 
          ? "/dashboard/admin" 
          : "/dashboard/supplier";
        if (targetPath !== pathname && lastRedirectedPathRef.current !== targetPath) {
          isRedirectingRef.current = true;
          lastRedirectedPathRef.current = targetPath;
          toast.error("شما دسترسی به این بخش را ندارید");
          router.replace(targetPath);
          setTimeout(() => {
            isRedirectingRef.current = false;
          }, 100);
        }
        return;
      }
    }

    // Protect supplier routes
    if (pathname.startsWith("/dashboard/supplier")) {
      if (normalizedRole !== "supplier") {
        const targetPath = normalizedRole === "admin" 
          ? "/dashboard/admin" 
          : "/dashboard/customer";
        if (targetPath !== pathname && lastRedirectedPathRef.current !== targetPath) {
          isRedirectingRef.current = true;
          lastRedirectedPathRef.current = targetPath;
          toast.error("شما دسترسی به این بخش را ندارید");
          router.replace(targetPath);
          setTimeout(() => {
            isRedirectingRef.current = false;
          }, 100);
        }
        return;
      }
    }

    // User is on correct route - reset redirect tracking
    if (lastRedirectedPathRef.current && lastRedirectedPathRef.current !== pathname) {
      lastRedirectedPathRef.current = "";
    }
  }, [isAuthenticated, user, isLoading, router, pathname]);

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
    <ChatProvider>
      <DashboardLayoutContent
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        {children}
      </DashboardLayoutContent>
    </ChatProvider>
  );
}

function DashboardLayoutContent({
  children,
  sidebarOpen,
  setSidebarOpen,
}: {
  children: ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <div className="min-h-screen bg-brand-off-white flex">
      {/* Single Sidebar Component - handles both desktop and mobile */}
      {/* In desktop, sidebar is always open (onClose is only for mobile) */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 ">
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden bg-white border-b border-brand-medium-gray px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
            aria-label="باز کردن منو"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Page Content */}
        <div className="max-w-7xl mx-auto p-4  pr-[250px] mt-4">
          {children}
        </div>
      </main>

      {/* Chat Sidebar (Left) - Fixed positioning */}
      <ChatSidebar />
    </div>
  );
}

