"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheckIcon, ClockIcon } from "@heroicons/react/24/outline";
import Button from "../components/Button";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../lib/api";
import toast from "react-hot-toast";
import logger from "../utils/logger";
import { getErrorMessage } from "../utils/errorHandler";
import LoadingSpinner from "../components/LoadingSpinner";

export default function OTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const isAdmin = searchParams.get("admin") === "true";
  const redirectPath = searchParams.get("redirect");
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(0);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Auto focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Fetch OTP code from API (for display in mock mode)
  useEffect(() => {
    if (phone) {
      const fetchOtp = async () => {
        try {
          const response = await apiClient.getOtp(phone);
          if (response.code) {
            setOtpCode(response.code);
            setOtpExpiresIn(response.expiresIn || 0);
          }
        } catch (error) {
          // Failed to fetch OTP - will use manual entry
        }
      };

      fetchOtp();
      // Poll for OTP updates every 2 seconds
      const interval = setInterval(fetchOtp, 2000);
      return () => clearInterval(interval);
    }
  }, [phone]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    
    // Handle paste or multiple characters
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      for (let i = 0; i < digits.length && (index + i) < 6; i++) {
        newOtp[index + i] = digits[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + digits.length, 5);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 0);
      return;
    }

    // Single character input
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input if value entered
    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If current input is empty, go to previous and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 0);
      } else if (otp[index]) {
        // If current input has value, clear it
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
    
    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    
    // Handle delete key
    if (e.key === "Delete") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    
    // Find which input was focused when paste happened
    const focusedIndex = inputRefs.current.findIndex(ref => ref === document.activeElement);
    const startIndex = focusedIndex >= 0 ? focusedIndex : 0;
    
    for (let i = 0; i < pastedData.length && (startIndex + i) < 6; i++) {
      newOtp[startIndex + i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(startIndex + pastedData.length, 5);
    setTimeout(() => {
      inputRefs.current[nextIndex]?.focus();
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("لطفاً کد تایید 6 رقمی را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      // Get fullName and role from sessionStorage if available (from registration)
      const registrationData = sessionStorage.getItem(`registration_${phone}`);
      const registrationInfo = registrationData ? JSON.parse(registrationData) : null;
      
      const response = await apiClient.verifyOtp({
        phone,
        otp: otpCode,
        ...(registrationInfo?.fullName && { fullName: registrationInfo.fullName }),
        ...(registrationInfo?.role && { role: registrationInfo.role }),
      });
      
      // Clear registration data
      if (registrationData) {
        sessionStorage.removeItem(`registration_${phone}`);
      }

      // Login user with context
      // Normalize role - handle both uppercase and lowercase from backend
      const backendRole = response.user.role || "";
      const normalizedRole = backendRole.toLowerCase() as "customer" | "supplier" | "admin";
      
      // If admin login was initiated but backend doesn't return admin role, log warning
      if (isAdmin && normalizedRole !== "admin") {
        logger.warn("Admin login detected but backend returned non-admin role", {
          phone,
          backendRole,
          normalizedRole,
        });
      }
      
      const userData = {
        id: response.user.id,
        phone: response.user.phone,
        role: normalizedRole,
        fullName: response.user.fullName,
        email: response.user.email,
      };

      // Pass token to login function to ensure it's set in both localStorage and cookie
      await login(userData, response.accessToken);

      toast.success("ورود موفقیت‌آمیز بود");

      // Wait longer to ensure cookie and state are fully set before redirect
      // This prevents redirect loops and ensures AuthContext has time to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify that token and user data are actually set before redirecting
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");
      if (!token || !storedUser) {
        toast.error("خطا در ذخیره اطلاعات ورود. لطفاً دوباره تلاش کنید.");
        return;
      }

      // Verify user role matches expected role
      try {
        const parsedUser = JSON.parse(storedUser);
        if (isAdmin && parsedUser.role !== "admin") {
          logger.warn("Admin login failed: user role mismatch", {
            expected: "admin",
            actual: parsedUser.role,
          });
          toast.error("شما دسترسی به پنل مدیریت را ندارید");
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        logger.error("Error parsing stored user data", error);
      }

      // Determine target path
      let targetPath: string;
      const role = userData.role;
      
      // If redirectPath is provided, validate it matches user role
      if (redirectPath) {
        // Check if redirect path matches user role
        const isAdminPath = redirectPath.startsWith("/dashboard/admin");
        const isSupplierPath = redirectPath.startsWith("/dashboard/supplier");
        const isCustomerPath = redirectPath.startsWith("/dashboard/customer");
        
        // Validate redirect path matches user role
        if (isAdminPath && role !== "admin") {
          // User is not admin but trying to access admin path
          logger.warn("Redirect path mismatch: user is not admin but redirecting to admin path", {
            role,
            redirectPath,
            isAdmin,
          });
          // Redirect to appropriate dashboard based on role
          if (role === "supplier") {
            targetPath = "/dashboard/supplier";
          } else {
            targetPath = "/dashboard/customer";
          }
        } else if (isSupplierPath && role !== "supplier") {
          // User is not supplier but trying to access supplier path
          if (role === "admin") {
            targetPath = "/dashboard/admin";
          } else {
            targetPath = "/dashboard/customer";
          }
        } else if (isCustomerPath && role !== "customer") {
          // User is not customer but trying to access customer path
          if (role === "admin") {
            targetPath = "/dashboard/admin";
          } else {
            targetPath = "/dashboard/supplier";
          }
        } else {
          // Redirect path is valid for user role
          targetPath = redirectPath;
        }
      } else {
        // Redirect to appropriate dashboard based on user role
        if (role === "admin") {
          targetPath = "/dashboard/admin";
        } else if (role === "supplier") {
          targetPath = "/dashboard/supplier";
        } else {
          targetPath = "/dashboard/customer";
        }
      }
      
      // Use window.location.href for admin redirect to ensure full page reload
      // This ensures AuthContext state is properly initialized and prevents redirect loops
      if (role === "admin" && targetPath.startsWith("/dashboard/admin")) {
        window.location.href = targetPath;
      } else {
        // Use router.push for other redirects
        router.push(targetPath);
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      logger.error("OTP verification error", err);
      toast.error(errorMessage);
      // Clear OTP inputs on error
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) {
      toast.error("شماره موبایل یافت نشد");
      router.push("/login");
      return;
    }

    setIsResending(true);
    try {
      await apiClient.register({
        phone,
        fullName: `User ${phone}`, // Default name
      });

      toast.success("کد تایید مجدداً ارسال شد");
      setTimer(120);
      setCanResend(false);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "خطا در ارسال مجدد کد تایید";
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-brand-medium-gray animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-brand-light-sky rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-8 h-8 text-brand-medium-blue" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-brand-dark-blue font-display">
              تایید شماره موبایل
            </h1>
            <p className="text-center text-sm text-brand-medium-blue mb-4">
              کد تایید به شماره <span className="font-semibold text-brand-dark-blue">{phone}</span> ارسال شد
            </p>
            {/* OTP Display Box */}
            {otpCode && (
              <div className="bg-gradient-to-r from-brand-medium-blue to-brand-dark-blue border-2 border-brand-medium-blue rounded-lg p-4 mb-6 animate-fade-in shadow-lg">
                <p className="text-xs text-center text-white font-medium mb-2">
                  🔐 کد تایید شما (نسخه دمو):
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-white font-mono tracking-wider">
                    {otpCode}
                  </span>
                </div>
                {otpExpiresIn > 0 && (
                  <p className="text-xs text-center text-white/80 mt-2">
                    زمان باقیمانده: {formatTime(otpExpiresIn)} ثانیه
                  </p>
                )}
              </div>
            )}
            
            {!otpCode && (
              <div className="bg-brand-light-sky border border-brand-medium-blue rounded-lg p-3 mb-6 animate-fade-in">
                <p className="text-xs text-center text-brand-dark-blue">
                  <span className="font-semibold">نسخه دمو:</span> برای تست، هر کد 6 رقمی را وارد کنید
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-row-reverse justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onInput={(e) => {
                      // Ensure only numbers are entered
                      const target = e.target as HTMLInputElement;
                      if (target.value && !/^\d$/.test(target.value)) {
                        target.value = target.value.replace(/\D/g, "");
                      }
                    }}
                    dir="ltr"
                    className="w-14 h-16 text-center text-2xl font-bold border-2 border-brand-medium-gray rounded-lg bg-white text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue transition-all duration-200 hover:border-brand-medium-blue animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s`, direction: "ltr" }}
                  />
                ))}
              </div>

              <div className="text-center">
                {timer > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-brand-medium-blue">
                    <ClockIcon className="w-4 h-4" />
                    <p>
                      ارسال مجدد کد در <span className="font-semibold text-brand-dark-blue">{formatTime(timer)}</span>
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-sm text-brand-medium-blue hover:text-brand-dark-blue hover:underline transition-colors font-medium animate-fade-in disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? "در حال ارسال..." : "ارسال مجدد کد"}
                  </button>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={otp.join("").length !== 6 || isLoading}
              >
                {isLoading ? "در حال تایید..." : "تایید"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-brand-medium-blue hover:text-brand-dark-blue hover:underline transition-colors"
              >
                تغییر شماره موبایل
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

