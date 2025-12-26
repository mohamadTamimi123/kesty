"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, UserIcon, DevicePhoneMobileIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../components/MobileLayout";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import { validatePhone, validateEmail, validatePassword } from "../../../../utils/validation";
import { CreateUserData, UserRole } from "../../../../types/user";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";

export default function CreateUserPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    phone: "",
    email: "",
    role: "user",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (currentUser?.role !== "admin" && currentUser?.role !== "ADMIN") {
      toast.error("شما دسترسی به این صفحه ندارید");
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, currentUser, router]);

  const handleChange = (field: keyof CreateUserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateUserData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "نام الزامی است";
    }

    const phoneError = validatePhone(formData.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("لطفاً تمام فیلدها را به درستی پر کنید");
      return;
    }

    setIsLoading(true);

    try {
      // Transform frontend role to backend format
      const roleMapping: Record<string, string> = {
        user: "CUSTOMER",
        supplier: "SUPPLIER",
        admin: "ADMIN",
      };

      await apiClient.createUser({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        role: roleMapping[formData.role] || formData.role.toUpperCase(),
        password: formData.password,
      });

      toast.success(`کاربر ${formData.name} با موفقیت ایجاد شد`);
      router.push("/dashboard/admin/users");
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "خطا در ایجاد کاربر");
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin/users"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowRightIcon className="w-4 h-4 ml-1" />
            بازگشت به لیست کاربران
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
            افزودن کاربر جدید
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات کاربر جدید را وارد کنید
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              id="name"
              name="name"
              label="نام و نام خانوادگی"
              placeholder="نام کاربر را وارد کنید"
              icon={<UserIcon className="w-5 h-5" />}
              iconPosition="start"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              required
            />

            <Input
              type="tel"
              id="phone"
              name="phone"
              label="شماره موبایل"
              placeholder="09123456789"
              icon={<DevicePhoneMobileIcon className="w-5 h-5" />}
              iconPosition="start"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              validation={validatePhone}
              error={errors.phone}
              helperText="شماره موبایل باید با فرمت 09123456789 وارد شود"
              required
            />

            <Input
              type="email"
              id="email"
              name="email"
              label="ایمیل"
              placeholder="user@example.com"
              icon={<EnvelopeIcon className="w-5 h-5" />}
              iconPosition="start"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              validation={validateEmail}
              error={errors.email}
              required
            />

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                نقش
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue bg-white"
              >
                <option value="user">کاربر</option>
                <option value="supplier">تولیدکننده</option>
                <option value="admin">مدیر</option>
              </select>
            </div>

            <Input
              type="password"
              id="password"
              name="password"
              label="رمز عبور"
              placeholder="رمز عبور را وارد کنید"
              icon={<LockClosedIcon className="w-5 h-5" />}
              iconPosition="start"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              validation={validatePassword}
              error={errors.password}
              showPasswordToggle
              helperText="رمز عبور باید حداقل 8 کاراکتر و شامل حروف بزرگ، کوچک و عدد باشد"
              required
            />

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/admin/users" className="flex-1">
                <Button variant="neutral" className="w-full" type="button">
                  لغو
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                isLoading={isLoading}
              >
                ایجاد کاربر
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
}

