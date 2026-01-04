"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  DevicePhoneMobileIcon, 
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowLeftIcon 
} from "@heroicons/react/24/outline";
import Button from "../components/Button";
import Input from "../components/Input";
import { validatePhone } from "../utils/validation";
import apiClient from "../lib/api";
import toast from "react-hot-toast";
import logger from "../utils/logger";
import { getErrorMessage } from "../utils/errorHandler";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const { isAuthenticated, user } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    // Don't redirect if we're in the middle of OTP verification
    // Check if we're coming from OTP page by checking if there's a phone in URL
    const currentPath = window.location.pathname;
    if (currentPath === "/otp") {
      return;
    }

    if (isAuthenticated && user) {
      // Small delay to ensure state is fully set
      const timer = setTimeout(() => {
        const role = user.role?.toLowerCase();
        const normalizedRole = 
          role === "customer" || role === "CUSTOMER" ? "customer" :
          role === "supplier" || role === "SUPPLIER" ? "supplier" :
          role === "admin" || role === "ADMIN" ? "admin" : null;
        
        if (redirectPath) {
          // Validate redirect path matches user role
          const isAdminPath = redirectPath.startsWith("/dashboard/admin");
          const isSupplierPath = redirectPath.startsWith("/dashboard/supplier");
          const isCustomerPath = redirectPath.startsWith("/dashboard/customer");
          
          // Check if redirect path is valid for user role
          if (isAdminPath && normalizedRole !== "admin") {
            // User is not admin but trying to access admin path
            // Redirect to appropriate dashboard based on role
            if (normalizedRole === "supplier") {
              router.push("/dashboard/supplier");
            } else if (normalizedRole === "customer") {
              router.push("/dashboard/customer");
            } else {
              router.push("/dashboard");
            }
          } else if (isSupplierPath && normalizedRole !== "supplier") {
            if (normalizedRole === "admin") {
              router.push("/dashboard/admin");
            } else if (normalizedRole === "customer") {
              router.push("/dashboard/customer");
            } else {
              router.push("/dashboard");
            }
          } else if (isCustomerPath && normalizedRole !== "customer") {
            if (normalizedRole === "admin") {
              router.push("/dashboard/admin");
            } else if (normalizedRole === "supplier") {
              router.push("/dashboard/supplier");
            } else {
              router.push("/dashboard");
            }
          } else {
            // Redirect path is valid for user role
            router.push(redirectPath);
          }
        } else {
          // Redirect to role-specific dashboard directly
          if (normalizedRole === "admin") {
            router.push("/dashboard/admin");
          } else if (normalizedRole === "supplier") {
            router.push("/dashboard/supplier");
          } else if (normalizedRole === "customer") {
            router.push("/dashboard/customer");
          } else {
            // Fallback to /dashboard which will handle redirect
            router.push("/dashboard");
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, redirectPath, router]);

  useEffect(() => {
    const phoneTrimmed = phone.trim();
    const validationError = validatePhone(phoneTrimmed);
    setIsValid(!validationError && phoneTrimmed.length > 0);
  }, [phone]);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const validationError = validatePhone(value);
    setError(validationError || "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phoneTrimmed = phone.trim();
    const validationError = validatePhone(phoneTrimmed);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call register endpoint to send OTP (works for both new and existing users)
      await apiClient.register({
        phone: phoneTrimmed,
        fullName: `User ${phoneTrimmed}`, // Default name, will be updated after OTP verification
      });

      toast.success("کد تایید به شماره موبایل شما ارسال شد");
      const otpUrl = redirectPath 
        ? `/otp?phone=${encodeURIComponent(phoneTrimmed)}&redirect=${encodeURIComponent(redirectPath)}`
        : `/otp?phone=${encodeURIComponent(phoneTrimmed)}`;
      router.push(otpUrl);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logger.error("Login error", err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast("ورود با گوگل به زودی فعال خواهد شد", {
      icon: "ℹ️",
      duration: 3000,
    });
    // Will be implemented with NextAuth
    // Google login functionality coming soon
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-off-white via-white to-brand-light-sky">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-brand-medium-blue hover:text-brand-dark-blue transition-colors group"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">بازگشت</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-8 border border-brand-medium-gray animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-light-sky rounded-full mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-brand-medium-blue" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-brand-dark-blue font-display">
                ورود به حساب کاربری
              </h1>
              <p className="text-sm text-brand-medium-blue">
                برای ادامه، شماره موبایل خود را وارد کنید
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                type="tel"
                id="phone"
                name="phone"
                label="شماره موبایل"
                placeholder="09123456789"
                icon={<DevicePhoneMobileIcon className="w-5 h-5" />}
                iconPosition="start"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                validation={validatePhone}
                error={error}
                helperText="کد تایید به این شماره ارسال خواهد شد"
                required
                autoFocus
              />

              {/* Info Box */}
              <div className="bg-brand-light-sky border border-brand-medium-blue rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="w-5 h-5 text-brand-medium-blue flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-brand-dark-blue leading-relaxed">
                      <span className="font-semibold">نکته:</span> پس از وارد کردن شماره موبایل، 
                      کد تایید 6 رقمی برای شما ارسال می‌شود. این کد برای 2 دقیقه معتبر است.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full"
                disabled={!isValid || isLoading}
                isLoading={isLoading}
              >
                {isLoading ? "در حال ارسال کد تایید..." : "دریافت کد تایید"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-medium-gray"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-brand-medium-blue">یا</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full flex items-center justify-center gap-3"
              onClick={handleGoogleLogin}
              disabled
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>ورود با گوگل</span>
              <span className="text-xs opacity-60">(به زودی)</span>
            </Button>

            {/* Links Section */}
            <div className="mt-8 space-y-3 pt-6 border-t border-brand-medium-gray">
              <div className="text-center">
                <p className="text-sm text-brand-medium-blue mb-2">
                  حساب کاربری ندارید؟{" "}
                  <Link
                    href={`/register${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                    className="font-semibold text-brand-medium-blue hover:text-brand-dark-blue hover:underline transition-colors"
                  >
                    ثبت نام کنید
                  </Link>
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-xs text-brand-medium-blue">
                <Link
                  href={`/admin/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-medium hover:text-brand-dark-blue hover:underline transition-colors"
                >
                  ورود ادمین
                </Link>
                <span className="text-brand-medium-gray">•</span>
                <Link
                  href="/"
                  className="font-medium hover:text-brand-dark-blue hover:underline transition-colors"
                >
                  صفحه اصلی
                </Link>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-brand-medium-gray">
              <div className="flex items-center justify-center gap-2 text-xs text-brand-medium-blue">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>اطلاعات شما با امنیت کامل محافظت می‌شود</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

