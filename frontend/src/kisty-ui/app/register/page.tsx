"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DevicePhoneMobileIcon, LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";
import Button from "../components/Button";
import Input from "../components/Input";
import { validatePhone, validatePassword, validatePasswordMatch } from "../utils/validation";
import apiClient from "../lib/api";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER" as "CUSTOMER" | "SUPPLIER",
  });
  const [errors, setErrors] = useState({
    phone: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update form validity whenever formData or errors change
  useEffect(() => {
    const phoneValid = !errors.phone && formData.phone.length > 0;
    const fullNameValid = !errors.fullName && formData.fullName.length > 0;
    const passwordValid = !errors.password && formData.password.length > 0;
    const confirmPasswordValid = !errors.confirmPassword && formData.confirmPassword.length > 0;
    
    setIsFormValid(phoneValid && fullNameValid && passwordValid && confirmPasswordValid);
  }, [formData, errors]);

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    const error = validatePhone(value);
    setErrors((prev) => ({ ...prev, phone: error || "" }));
  };

  const handleFullNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, fullName: value }));
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, fullName: "نام و نام خانوادگی الزامی است" }));
    } else {
      setErrors((prev) => ({ ...prev, fullName: "" }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, password: value };
      // Also validate confirm password if it has a value
      if (prev.confirmPassword) {
        const confirmError = validatePasswordMatch(value, prev.confirmPassword);
        setErrors((prevErrors) => ({ ...prevErrors, confirmPassword: confirmError || "" }));
      }
      return newData;
    });
    const error = validatePassword(value);
    setErrors((prev) => ({ ...prev, password: error || "" }));
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData((prev) => ({ ...prev, confirmPassword: value }));
    const error = validatePasswordMatch(formData.password, value);
    setErrors((prev) => ({ ...prev, confirmPassword: error || "" }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Final validation
    const phoneError = validatePhone(formData.phone);
    const fullNameError = !formData.fullName.trim() ? "نام و نام خانوادگی الزامی است" : "";
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validatePasswordMatch(formData.password, formData.confirmPassword);
    
    setErrors({
      phone: phoneError || "",
      fullName: fullNameError,
      password: passwordError || "",
      confirmPassword: confirmPasswordError || "",
    });

    if (!phoneError && !fullNameError && !passwordError && !confirmPasswordError) {
      setIsLoading(true);
      try {
        // Store registration data for OTP verification
        sessionStorage.setItem(
          `registration_${formData.phone}`,
          JSON.stringify({ 
            fullName: formData.fullName,
            role: formData.role 
          })
        );

        // Call register endpoint to send OTP
        await apiClient.register({
          phone: formData.phone,
          fullName: formData.fullName,
          password: formData.password,
        });

        toast.success("کد تایید ارسال شد");
        router.push(`/otp?phone=${encodeURIComponent(formData.phone)}`);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "خطا در ثبت نام";
        toast.error(errorMessage);
        if (err.response?.data?.message?.includes("موبایل")) {
          setErrors((prev) => ({ ...prev, phone: errorMessage }));
        }
      } finally {
        setIsLoading(false);
      }
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
              ایجاد حساب کاربری
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
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                validation={validatePhone}
                error={errors.phone}
                helperText="شماره موبایل خود را با فرمت 09123456789 وارد کنید"
                required
              />

              <Input
                type="text"
                id="fullName"
                name="fullName"
                label="نام و نام خانوادگی"
                placeholder="نام و نام خانوادگی خود را وارد کنید"
                icon={<UserIcon className="w-5 h-5" />}
                iconPosition="start"
                value={formData.fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                error={errors.fullName}
                required
              />

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-3">
                  نوع حساب کاربری
                </label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="CUSTOMER"
                      checked={formData.role === "CUSTOMER"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as "CUSTOMER" | "SUPPLIER" }))}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-all ${
                      formData.role === "CUSTOMER"
                        ? "border-brand-medium-blue bg-brand-light-sky"
                        : "border-brand-medium-gray bg-white hover:border-brand-medium-blue"
                    }`}>
                      <div className="text-center">
                        <div className="text-sm font-medium text-brand-dark-blue mb-1">
                          مشتری
                        </div>
                        <div className="text-xs text-brand-medium-blue">
                          ثبت و مدیریت پروژه
                        </div>
                      </div>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="SUPPLIER"
                      checked={formData.role === "SUPPLIER"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as "CUSTOMER" | "SUPPLIER" }))}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-all ${
                      formData.role === "SUPPLIER"
                        ? "border-brand-medium-blue bg-brand-light-sky"
                        : "border-brand-medium-gray bg-white hover:border-brand-medium-blue"
                    }`}>
                      <div className="text-center">
                        <div className="text-sm font-medium text-brand-dark-blue mb-1">
                          تولیدکننده
                        </div>
                        <div className="text-xs text-brand-medium-blue">
                          پاسخ به درخواست‌ها
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <Input
                type="password"
                id="password"
                name="password"
                label="رمز عبور"
                placeholder="••••••••"
                icon={<LockClosedIcon className="w-5 h-5" />}
                iconPosition="start"
                showPasswordToggle={true}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                validation={validatePassword}
                error={errors.password}
                helperText="رمز عبور باید حداقل 8 کاراکتر و شامل حروف بزرگ، کوچک و عدد باشد"
                required
              />

              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                label="تکرار رمز عبور"
                placeholder="••••••••"
                icon={<LockClosedIcon className="w-5 h-5" />}
                iconPosition="start"
                showPasswordToggle={true}
                value={formData.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                validation={(value) => validatePasswordMatch(formData.password, value)}
                error={errors.confirmPassword}
                required
              />

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-brand-medium-blue focus:ring-brand-medium-blue border-brand-medium-gray rounded"
                  required
                />
                <label htmlFor="terms" className="mr-2 block text-sm text-brand-medium-blue">
                  با شرایط و قوانین موافقم
                </label>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full"
                disabled={!isFormValid || isLoading}
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

            <div className="mt-6 text-center">
              <p className="text-sm text-brand-medium-blue">
                قبلاً ثبت نام کرده‌اید؟{" "}
                <Link
                  href="/login"
                  className="font-medium text-brand-medium-blue hover:text-brand-dark-blue hover:underline transition-colors"
                >
                  وارد شوید
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

