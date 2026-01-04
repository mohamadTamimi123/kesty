"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../../components/MobileLayout";
import Button from "../../../../../components/Button";
import Input from "../../../../../components/Input";
import { UpdateMachineData, Machine } from "../../../../../types/machine";
import { Category } from "../../../../../types/category";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../../utils/logger";

export default function EditMachinePage() {
  const router = useRouter();
  const params = useParams();
  const machineId = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<UpdateMachineData>({
    name: "",
    categoryId: undefined,
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateMachineData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMachine, setIsLoadingMachine] = useState(true);

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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.getActiveCategories();
        setCategories(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching categories", error);
      }
    };

    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Load machine data
  useEffect(() => {
    const fetchMachine = async () => {
      try {
        setIsLoadingMachine(true);
        const machineData = await apiClient.getMachineById(machineId);
        setMachine(machineData);
        setFormData({
          name: machineData.name,
          categoryId: machineData.categoryId || undefined,
          description: machineData.description || "",
          isActive: machineData.isActive,
        });
      } catch (error: unknown) {
        logger.error("Error fetching machine", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت اطلاعات دستگاه";
        toast.error(errorMessage);
        router.push("/dashboard/admin/machines");
      } finally {
        setIsLoadingMachine(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN") && machineId) {
      fetchMachine();
    }
  }, [isAuthenticated, currentUser, machineId, router]);

  const handleChange = (field: keyof UpdateMachineData, value: string | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateMachineData, string>> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "نام دستگاه باید حداقل 2 کاراکتر باشد";
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
      await apiClient.updateMachine(machineId, {
        name: formData.name?.trim(),
        categoryId: formData.categoryId || undefined,
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      });

      toast.success(`دستگاه ${formData.name} با موفقیت به‌روزرسانی شد`);
      router.push("/dashboard/admin/machines");
    } catch (error: unknown) {
      logger.error("Error updating machine", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در به‌روزرسانی دستگاه";
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoadingMachine) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!machine) {
    return null;
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin/machines"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowRightIcon className="w-4 h-4 ml-1" />
            بازگشت به لیست دستگاه‌ها
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
            ویرایش دستگاه
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات دستگاه را ویرایش کنید
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              id="name"
              name="name"
              label="نام دستگاه"
              placeholder="نام دستگاه را وارد کنید"
              icon={<WrenchScrewdriverIcon className="w-5 h-5" />}
              iconPosition="start"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              required
            />

            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                دسته‌بندی
                <span className="text-xs text-brand-medium-gray mr-2">(اختیاری)</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId || ""}
                onChange={(e) =>
                  handleChange("categoryId", e.target.value || undefined)
                }
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
              >
                <option value="">بدون دسته‌بندی</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                توضیحات
                <span className="text-xs text-brand-medium-gray mr-2">(اختیاری)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="توضیحات دستگاه را وارد کنید"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="w-4 h-4 text-brand-medium-blue border-brand-medium-gray rounded focus:ring-brand-medium-blue"
                />
                <span className="text-sm text-brand-dark-blue">فعال</span>
              </label>
              <p className="text-xs text-brand-medium-blue mt-1">
                دستگاه‌های غیرفعال در لیست‌های عمومی نمایش داده نمی‌شوند
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/admin/machines" className="flex-1">
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

