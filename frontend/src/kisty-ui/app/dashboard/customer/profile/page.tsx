"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { useAuth } from "../../../contexts/AuthContext";
import { validatePhone, validateEmail } from "../../../utils/validation";
import logger from "../../../utils/logger";
import apiClient from "../../../lib/api";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams?.get("customerId");
  const { user, updateUser } = useAuth();
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    company: "",
    birthDate: "",
    bio: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch customer data if customerId is provided
  useEffect(() => {
    if (customerId && customerId !== user?.id) {
      setIsViewMode(true);
      setIsLoadingCustomer(true);
      // Try to get customer profile - use admin endpoint if available
      // Note: This might require proper permissions
      apiClient
        .getUserById(customerId)
        .then((customerData) => {
          setViewingCustomer(customerData);
          setFormData({
            name: customerData.fullName || customerData.name || "",
            phone: customerData.phone || "",
            email: customerData.email || "",
            address: customerData.address || "",
            city: customerData.city || "",
            company: customerData.company || customerData.workshopName || "",
            birthDate: customerData.birthDate || customerData.dateOfBirth || "",
            bio: customerData.bio || "",
          });
        })
        .catch((error) => {
          logger.error("Error fetching customer data", error);
          router.back();
        })
        .finally(() => {
          setIsLoadingCustomer(false);
        });
    } else if (user) {
      setIsViewMode(false);
      setFormData({
        name: user.name || user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
        address: (user as any).address || "",
        city: (user as any).city || "",
        company: (user as any).company || (user as any).workshopName || "",
        birthDate: (user as any).birthDate || (user as any).dateOfBirth || "",
        bio: (user as any).bio || "",
      });
    }
  }, [user, customerId, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    
    setSuccessMessage("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "نام الزامی است";
    }

    if (formData.phone) {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) newErrors.phone = phoneError;
    }

    if (formData.email) {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update user in context
      updateUser({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      });

      setSuccessMessage("اطلاعات با موفقیت به‌روزرسانی شد");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      logger.error("Error updating profile", error);
      setErrors({ submit: "خطا در به‌روزرسانی اطلاعات" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCustomer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
                {isViewMode ? "پروفایل مشتری" : "تنظیمات پروفایل"}
              </h1>
              <p className="text-brand-medium-blue">
                {isViewMode
                  ? "اطلاعات پروفایل مشتری"
                  : "اطلاعات شخصی و حساب کاربری خود را مدیریت کنید"}
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 animate-fade-in">
                {successMessage}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
              {/* Profile Picture Section */}
              <div className="mb-8 pb-8 border-b border-brand-medium-gray">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-brand-light-sky flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-brand-medium-blue" />
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 w-8 h-8 bg-brand-medium-blue text-white rounded-full flex items-center justify-center hover:bg-brand-dark-blue transition-colors shadow-md"
                    >
                      <CameraIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-dark-blue mb-1">
                      تصویر پروفایل
                    </h3>
                    <p className="text-sm text-brand-medium-blue mb-3">
                      فرمت‌های مجاز: JPG, PNG (حداکثر 2MB)
                    </p>
                    <Button variant="secondary" size="sm" type="button">
                      تغییر تصویر
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                style={{ pointerEvents: isViewMode ? "none" : "auto" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="text"
                    name="name"
                    label="نام و نام خانوادگی"
                    placeholder="نام خود را وارد کنید"
                    icon={<UserIcon className="w-5 h-5" />}
                    iconPosition="start"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={errors.name}
                    required
                  />

                  <Input
                    type="tel"
                    name="phone"
                    label="شماره موبایل"
                    placeholder="09123456789"
                    icon={<DevicePhoneMobileIcon className="w-5 h-5" />}
                    iconPosition="start"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    validation={validatePhone}
                    error={errors.phone}
                    required
                  />

                  <Input
                    type="email"
                    name="email"
                    label="ایمیل"
                    placeholder="example@email.com"
                    icon={<EnvelopeIcon className="w-5 h-5" />}
                    iconPosition="start"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    validation={validateEmail}
                    error={errors.email}
                  />

                  <Input
                    type="text"
                    name="city"
                    label="شهر"
                    placeholder="شهر محل سکونت"
                    icon={<MapPinIcon className="w-5 h-5" />}
                    iconPosition="start"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />

                  <Input
                    type="text"
                    name="company"
                    label="شرکت / سازمان"
                    placeholder="نام شرکت یا سازمان"
                    icon={<BuildingOfficeIcon className="w-5 h-5" />}
                    iconPosition="start"
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                  />

                  <Input
                    type="date"
                    name="birthDate"
                    label="تاریخ تولد"
                    icon={<CalendarIcon className="w-5 h-5" />}
                    iconPosition="start"
                    value={formData.birthDate}
                    onChange={(e) => handleChange("birthDate", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                    آدرس
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg bg-white text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue transition-colors"
                    placeholder="آدرس کامل خود را وارد کنید"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                    درباره من
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg bg-white text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue transition-colors"
                    placeholder="توضیحات درباره خودتان..."
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                  />
                </div>

                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {errors.submit}
                  </div>
                )}

                {!isViewMode && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      ذخیره تغییرات
                    </Button>
                    <Button
                      type="button"
                      variant="neutral"
                      onClick={() => router.back()}
                    >
                      انصراف
                    </Button>
                  </div>
                )}
                {isViewMode && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="neutral"
                      onClick={() => router.back()}
                    >
                      بازگشت
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
    </div>
  );
}

