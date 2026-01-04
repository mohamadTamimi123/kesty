"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Normalize role to handle both uppercase and lowercase
    const role = user.role?.toLowerCase();
    const normalizedRole = 
      role === "customer" || role === "CUSTOMER" ? "customer" :
      role === "supplier" || role === "SUPPLIER" ? "supplier" :
      role === "admin" || role === "ADMIN" ? "admin" : null;

    // Redirect to appropriate dashboard based on role
    if (normalizedRole === "admin") {
      router.push("/dashboard/admin");
    } else if (normalizedRole === "supplier") {
      router.push("/dashboard/supplier");
    } else if (normalizedRole === "customer") {
      router.push("/dashboard/customer");
    } else {
      // Invalid role, redirect to login
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading state while checking auth or redirecting
  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-medium-blue mx-auto"></div>
        <p className="mt-4 text-brand-medium-blue">در حال هدایت به داشبورد...</p>
      </div>
    </div>
  );
}

