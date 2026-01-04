"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, CubeIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../../components/MobileLayout";
import Button from "../../../../../components/Button";
import Input from "../../../../../components/Input";
import { UpdateMaterialData, Material } from "../../../../../types/material";
import { Category } from "../../../../../types/category";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../../utils/logger";

export default function EditMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [material, setMaterial] = useState<Material | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<UpdateMaterialData>({
    name: "",
    categoryId: undefined,
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateMaterialData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(true);

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

  // Load material data
  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setIsLoadingMaterial(true);
        const materialData = await apiClient.getMaterialById(materialId);
        setMaterial(materialData);
        setFormData({
          name: materialData.name,
          categoryId: materialData.categoryId || undefined,
          description: materialData.description || "",
          isActive: materialData.isActive,
        });
      } catch (error: unknown) {
        logger.error("Error fetching material", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت اطلاعات متریال";
        toast.error(errorMessage);
        router.push("/dashboard/admin/materials");
      } finally {
        setIsLoadingMaterial(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN") && materialId) {
      fetchMaterial();
    }
  }, [isAuthenticated, currentUser, materialId, router]);

  const handleChange = (field: keyof UpdateMaterialData, value: string | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateMaterialData, string>> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "نام متریال باید حداقل 2 کاراکتر باشد";
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
      await apiClient.updateMaterial(materialId, {
        name: formData.name?.trim(),
        categoryId: formData.categoryId || undefined,
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      });

      toast.success(`متریال ${formData.name} با موفقیت به‌روزرسانی شد`);
      router.push("/dashboard/admin/materials");
    } catch (error: unknown) {
      logger.error("Error updating material", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در به‌روزرسانی متریال";
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoadingMaterial) {
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

  if (!material) {
    return null;
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin/materials"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowRightIcon className="w-4 h-4 ml-1" />
            بازگشت به لیست متریال‌ها
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
            ویرایش متریال
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات متریال را ویرایش کنید
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              id="name"
              name="name"
              label="نام متریال"
              placeholder="نام متریال را وارد کنید"
              icon={<CubeIcon className="w-5 h-5" />}
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
                placeholder="توضیحات متریال را وارد کنید"
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
                متریال‌های غیرفعال در لیست‌های عمومی نمایش داده نمی‌شوند
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/admin/materials" className="flex-1">
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

