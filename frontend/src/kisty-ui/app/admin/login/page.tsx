"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DevicePhoneMobileIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { validatePhone } from "../../utils/validation";
import { ADMIN_CREDENTIALS } from "../../data/adminCredentials";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const validationError = validatePhone(value);
    setPhoneError(validationError || "");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!value) {
      setPasswordError("رمز عبور الزامی است");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate phone
    const phoneValidationError = validatePhone(phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    // Validate password
    if (!password) {
      setPasswordError("رمز عبور الزامی است");
      return;
    }

    setIsLoading(true);
    setPhoneError("");
    setPasswordError("");

    try {
      // Call the real login API
      const response = await apiClient.login({
        phone,
        password,
      });

      // The backend sends OTP after password verification
      // Store the phone for OTP verification
      toast.success("کد تایید ارسال شد");
      
      // Redirect to OTP page with admin context
      const redirectPath = searchParams.get("redirect") || "/dashboard/admin";
      router.push(`/otp?phone=${encodeURIComponent(phone)}&admin=true&redirect=${encodeURIComponent(redirectPath)}`);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "شماره موبایل یا رمز عبور اشتباه است";
      toast.error(errorMessage);
      setPasswordError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-brand-medium-gray animate-fade-in">
            <h1 className="text-2xl font-bold text-center mb-2 text-brand-dark-blue font-display">
              ورود به پنل مدیریت
            </h1>
            <p className="text-center text-sm text-brand-medium-blue mb-6">
              برای دسترسی به پنل مدیریت وارد شوید
            </p>
            
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
                error={phoneError}
                helperText={`شماره موبایل ادمین: ${ADMIN_CREDENTIALS.phone}`}
                required
              />

              <Input
                type="password"
                id="password"
                name="password"
                label="رمز عبور"
                placeholder="رمز عبور را وارد کنید"
                icon={<LockClosedIcon className="w-5 h-5" />}
                iconPosition="start"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                error={passwordError}
                showPasswordToggle
                helperText={`رمز عبور ادمین: ${ADMIN_CREDENTIALS.password}`}
                required
              />

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full"
                isLoading={isLoading}
                disabled={!phone || !password || !!phoneError || !!passwordError}
              >
                ورود به پنل مدیریت
              </Button>
            </form>

            <div className="mt-6 p-4 bg-brand-light-sky rounded-lg border border-brand-medium-blue">
              <p className="text-xs text-brand-dark-blue font-medium mb-3">
                🔐 اطلاعات ورود دمو (Super Admin):
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-medium-blue">شماره موبایل:</span>
                  <span className="text-xs font-mono font-semibold text-brand-dark-blue bg-white px-2 py-1 rounded">
                    {ADMIN_CREDENTIALS.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-medium-blue">رمز عبور:</span>
                  <span className="text-xs font-mono font-semibold text-brand-dark-blue bg-white px-2 py-1 rounded">
                    {ADMIN_CREDENTIALS.password}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-brand-medium-blue">
                  <p className="text-xs text-brand-medium-blue">
                    💡 <span className="font-medium">نکته:</span> پس از ورود، کد تایید OTP برای شما ارسال می‌شود.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

