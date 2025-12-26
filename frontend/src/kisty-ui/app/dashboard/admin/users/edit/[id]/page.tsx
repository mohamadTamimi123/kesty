"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, UserIcon, DevicePhoneMobileIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../../components/MobileLayout";
import Button from "../../../../../components/Button";
import Input from "../../../../../components/Input";
import { validatePhone, validateEmail } from "../../../../../utils/validation";
import { UpdateUserData, UserRole, UserStatus } from "../../../../../types/user";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import toast from "react-hot-toast";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<UpdateUserData>({
    name: "",
    phone: "",
    email: "",
    role: "user",
    status: "active",
  });
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateUserData | "password", string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoadingData(true);
        const user = await apiClient.getUserById(userId);
        
        // Transform backend data to frontend format
        const normalizeRole = (role: string): UserRole => {
          const upperRole = role?.toUpperCase();
          if (upperRole === "CUSTOMER") return "user";
          if (upperRole === "SUPPLIER") return "supplier";
          if (upperRole === "ADMIN") return "admin";
          return (role?.toLowerCase() || "user") as UserRole;
        };

        setFormData({
          name: user.fullName || user.name || "",
          phone: user.phone,
          email: user.email || "",
          role: normalizeRole(user.role),
          status: user.isBlocked ? "blocked" : (user.isActive ? "active" : "inactive") as UserStatus,
        });
      } catch (error: any) {
        console.error("Error fetching user:", error);
        toast.error(error.response?.data?.message || "کاربر یافت نشد");
        router.push("/dashboard/admin/users");
      } finally {
      setIsLoadingData(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN") && userId) {
      fetchUser();
    }
  }, [userId, router, isAuthenticated, currentUser]);

  const handleChange = (field: keyof UpdateUserData, value: string | UserRole | UserStatus) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateUserData | "password", string>> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "نام الزامی است";
    }

    if (formData.phone) {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) {
        newErrors.phone = phoneError;
      }
    }

    if (formData.email) {
      const emailError = validateEmail(formData.email);
      if (emailError) {
        newErrors.email = emailError;
      }
    }

    // Only validate password if it's provided
    if (password) {
      if (password.length < 8) {
        newErrors.password = "رمز عبور باید حداقل 8 کاراکتر باشد";
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = "رمز عبور باید شامل حداقل یک حرف بزرگ انگلیسی باشد";
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = "رمز عبور باید شامل حداقل یک حرف کوچک انگلیسی باشد";
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = "رمز عبور باید شامل حداقل یک عدد باشد";
      }
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
      // Transform frontend data to backend format
      const roleMapping: Record<string, string> = {
        user: "CUSTOMER",
        supplier: "SUPPLIER",
        admin: "ADMIN",
      };

      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      };

      if (formData.role) {
        updateData.role = roleMapping[formData.role] || formData.role.toUpperCase();
      }

      if (formData.status) {
        updateData.isActive = formData.status === "active";
        updateData.isBlocked = formData.status === "blocked";
      }

      if (password) {
        updateData.password = password;
      }

      await apiClient.updateUser(userId, updateData);

      toast.success(`اطلاعات کاربر ${formData.name} با موفقیت به‌روزرسانی شد`);
      router.push("/dashboard/admin/users");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "خطا در به‌روزرسانی کاربر");
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue">در حال بارگذاری...</div>
        </div>
      </MobileLayout>
    );
  }

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
            ویرایش کاربر
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات کاربر را ویرایش کنید
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
              value={formData.name || ""}
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
              value={formData.phone || ""}
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
              value={formData.email || ""}
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
                value={formData.role || "user"}
                onChange={(e) => handleChange("role", e.target.value as UserRole)}
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue bg-white"
              >
                <option value="user">کاربر</option>
                <option value="supplier">تولیدکننده</option>
                <option value="admin">مدیر</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                وضعیت
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || "active"}
                onChange={(e) => handleChange("status", e.target.value as UserStatus)}
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue bg-white"
              >
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="blocked">مسدود</option>
              </select>
            </div>

            <Input
              type="password"
              id="password"
              name="password"
              label="رمز عبور جدید (اختیاری)"
              placeholder="برای تغییر رمز عبور وارد کنید"
              icon={<LockClosedIcon className="w-5 h-5" />}
              iconPosition="start"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={errors.password}
              showPasswordToggle
              helperText="در صورت عدم نیاز به تغییر رمز عبور، این فیلد را خالی بگذارید"
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
                ذخیره تغییرات
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
}

