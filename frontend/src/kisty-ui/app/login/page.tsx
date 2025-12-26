"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import Button from "../components/Button";
import Input from "../components/Input";
import { validatePhone } from "../utils/validation";
import apiClient from "../lib/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsValid(!error && phone.length > 0);
  }, [phone, error]);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const validationError = validatePhone(value);
    setError(validationError || "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validatePhone(phone);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call register endpoint to send OTP (works for both new and existing users)
      await apiClient.register({
        phone,
        fullName: `User ${phone}`, // Default name, will be updated after OTP verification
      });

      toast.success("کد تایید ارسال شد");
      const otpUrl = redirectPath 
        ? `/otp?phone=${encodeURIComponent(phone)}&redirect=${encodeURIComponent(redirectPath)}`
        : `/otp?phone=${encodeURIComponent(phone)}`;
      router.push(otpUrl);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "خطا در ارسال کد تایید";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Will be implemented with NextAuth
    console.log("Google login clicked");
  };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-brand-medium-gray animate-fade-in">
            <h1 className="text-2xl font-bold text-center mb-6 text-brand-dark-blue font-display">
              ورود به حساب کاربری
            </h1>
            
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
                helperText="شماره موبایل خود را با فرمت 09123456789 وارد کنید"
                required
              />

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full"
                disabled={!isValid || isLoading}
              >
                {isLoading ? "در حال ارسال..." : "ادامه"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-medium-gray"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-brand-medium-blue">یا</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleGoogleLogin}
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
              ورود با گوگل
            </Button>

            <div className="mt-6 space-y-2 text-center">
              <p className="text-sm text-brand-medium-blue">
                حساب کاربری ندارید؟{" "}
                <Link
                  href="/register"
                  className="font-medium text-brand-medium-blue hover:text-brand-dark-blue hover:underline transition-colors"
                >
                  ثبت نام کنید
                </Link>
              </p>
              <p className="text-sm text-brand-medium-blue">
                ورود به پنل مدیریت؟{" "}
                <Link
                  href={`/admin/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-medium text-brand-medium-blue hover:text-brand-dark-blue hover:underline transition-colors"
                >
                  ورود ادمین
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

