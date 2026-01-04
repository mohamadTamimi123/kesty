"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, DocumentTextIcon, PhotoIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../../components/MobileLayout";
import Button from "../../../../../components/Button";
import Input from "../../../../../components/Input";
import { UpdateCategoryData, Category } from "../../../../../types/category";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../../utils/logger";
import { getErrorMessage } from "../../../../../utils/errorHandler";

// Simple slug generation function
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const getIconUrl = (iconUrl: string | null) => {
  if (!iconUrl) return null;
  if (iconUrl.startsWith('http')) return iconUrl;
  // API serves static files at /api/uploads/...
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';
  // iconUrl should be like /uploads/categories/filename.png
  // We need to convert it to /api/uploads/categories/filename.png
  const path = iconUrl.startsWith('/') ? iconUrl : `/${iconUrl}`;
  return `${apiUrl}/api${path}`;
};

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<UpdateCategoryData>({
    title: "",
    slug: "",
    description: "",
    isActive: true,
    metaTitle: "",
    metaDescription: "",
    parentId: null,
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateCategoryData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

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

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.getCategoryTree();
        setCategories(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching categories", error);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchCategories();
    }
  }, [isAuthenticated, currentUser]);

  // Load category data
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setIsLoadingCategory(true);
        const categoryData = await apiClient.getCategoryById(categoryId);
        setCategory(categoryData);
        setFormData({
          title: categoryData.title,
          slug: categoryData.slug,
          description: categoryData.description || "",
          isActive: categoryData.isActive,
          metaTitle: categoryData.metaTitle || "",
          metaDescription: categoryData.metaDescription || "",
          parentId: categoryData.parentId || null,
        });
        
        // Set icon preview if exists
        if (categoryData.iconUrl) {
          const iconUrl = getIconUrl(categoryData.iconUrl);
          if (iconUrl) {
            setIconPreview(iconUrl);
          }
        }
      } catch (error: unknown) {
        logger.error("Error fetching category", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت اطلاعات کتگوری";
        toast.error(errorMessage);
        router.push("/dashboard/admin/categories");
      } finally {
        setIsLoadingCategory(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN") && categoryId) {
      fetchCategory();
    }
  }, [isAuthenticated, currentUser, categoryId, router]);

  // Flatten categories for dropdown (excluding current category and its descendants)
  const flattenCategories = (cats: Category[], excludeId?: string, level = 0): Category[] => {
    const result: Category[] = [];
    for (const cat of cats) {
      if (cat.id === excludeId) continue; // Skip current category
      result.push({ ...cat, title: "  ".repeat(level) + cat.title });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, excludeId, level + 1));
      }
    }
    return result;
  };

  // Auto-generate slug when title changes (only if slug is empty or matches old title)
  useEffect(() => {
    if (formData.title && category && (!formData.slug || formData.slug === generateSlug(category.title))) {
      const autoSlug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.title, category]);

  const handleChange = (field: keyof UpdateCategoryData, value: string | boolean | null | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value === "" ? null : value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("فقط فایل‌های تصویری مجاز هستند");
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم فایل نباید بیشتر از 5 مگابایت باشد");
        return;
      }

      setIconFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateCategoryData, string>> = {};

    if (formData.title && formData.title.length < 2) {
      newErrors.title = "عنوان باید حداقل 2 کاراکتر باشد";
    }

    if (formData.slug && formData.slug.length < 2) {
      newErrors.slug = "اسلاگ باید حداقل 2 کاراکتر باشد";
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
      await apiClient.updateCategory(categoryId, {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        isActive: formData.isActive,
        icon: iconFile || undefined,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        parentId: formData.parentId,
      });

      toast.success(`کتگوری ${formData.title} با موفقیت به‌روزرسانی شد`);
      router.push("/dashboard/admin/categories");
    } catch (error: unknown) {
      logger.error("Error updating category", error);
      toast.error(getErrorMessage(error) || "خطا در به‌روزرسانی کتگوری");
      setIsLoading(false);
    }
  };

  if (isLoadingCategory) {
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

  if (!category) {
    return null;
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin/categories"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowRightIcon className="w-4 h-4 ml-1" />
            بازگشت به لیست کتگوری‌ها
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
            ویرایش کتگوری
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات کتگوری را ویرایش کنید
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              id="title"
              name="title"
              label="عنوان"
              placeholder="نام کتگوری را وارد کنید"
              icon={<DocumentTextIcon className="w-5 h-5" />}
              iconPosition="start"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              error={errors.title}
              required
            />

            <Input
              type="text"
              id="slug"
              name="slug"
              label="اسلاگ"
              placeholder="اسلاگ به صورت خودکار تولید می‌شود"
              icon={<DocumentTextIcon className="w-5 h-5" />}
              iconPosition="start"
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              error={errors.slug}
              helperText="اسلاگ به صورت خودکار از عنوان تولید می‌شود، اما می‌توانید آن را ویرایش کنید"
            />

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                توضیحات
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="توضیحات کتگوری را وارد کنید (اختیاری)"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="w-4 h-4 text-brand-medium-blue border-brand-medium-gray rounded focus:ring-brand-medium-blue"
                />
                <span className="text-sm text-brand-dark-blue">فعال</span>
              </label>
            </div>

            {/* Parent Category Selection */}
            <div>
              <label
                htmlFor="parentId"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                دسته والد (اختیاری)
              </label>
              <select
                id="parentId"
                name="parentId"
                value={formData.parentId || ""}
                onChange={(e) =>
                  handleChange("parentId", e.target.value || null)
                }
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
              >
                <option value="">بدون دسته والد (دسته اصلی)</option>
                {flattenCategories(categories, categoryId).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-brand-medium-blue mt-1">
                توجه: نمی‌توانید دسته را والد خودش یا زیرمجموعه‌هایش قرار دهید
              </p>
            </div>

            <div>
              <label
                htmlFor="icon"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                آیکون
              </label>
              <div className="space-y-3">
                {iconPreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-brand-medium-gray">
                    <Image
                      src={iconPreview}
                      alt="Icon preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="icon"
                    className="flex items-center gap-2 px-4 py-2 border border-brand-medium-gray rounded-lg cursor-pointer hover:bg-brand-light-gray transition-colors"
                  >
                    <PhotoIcon className="w-5 h-5 text-brand-medium-blue" />
                    <span className="text-sm text-brand-dark-blue">
                      {iconFile ? iconFile.name : category.iconUrl ? "تغییر آیکون" : "انتخاب فایل آیکون"}
                    </span>
                  </label>
                  <input
                    type="file"
                    id="icon"
                    name="icon"
                    accept="image/*"
                    onChange={handleIconChange}
                    className="hidden"
                  />
                  {(iconFile || category.iconUrl) && (
                    <Button
                      type="button"
                      variant="neutral"
                      size="sm"
                      onClick={() => {
                        setIconFile(null);
                        setIconPreview(category.iconUrl ? getIconUrl(category.iconUrl) : null);
                      }}
                    >
                      بازنشانی
                    </Button>
                  )}
                </div>
                <p className="text-xs text-brand-medium-blue">
                  فرمت‌های مجاز: JPG, PNG, WebP, SVG | حداکثر حجم: 5 مگابایت
                </p>
              </div>
            </div>

            <div className="border-t border-brand-medium-gray pt-6">
              <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">
                تنظیمات SEO
              </h3>
              
              <div className="space-y-4">
                <Input
                  type="text"
                  id="metaTitle"
                  name="metaTitle"
                  label="متا تایتل (SEO)"
                  placeholder="عنوان برای موتورهای جستجو (اختیاری)"
                  value={formData.metaTitle}
                  onChange={(e) => handleChange("metaTitle", e.target.value)}
                  helperText="اگر خالی باشد، از عنوان استفاده می‌شود"
                />

                <div>
                  <label
                    htmlFor="metaDescription"
                    className="block text-sm font-medium mb-2 text-brand-dark-blue"
                  >
                    متا دیسکریپشن (SEO)
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    rows={3}
                    placeholder="توضیحات برای موتورهای جستجو (اختیاری)"
                    value={formData.metaDescription}
                    onChange={(e) => handleChange("metaDescription", e.target.value)}
                    className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue resize-none"
                  />
                  <p className="text-xs text-brand-medium-blue mt-1">
                    توصیه می‌شود بین 120 تا 160 کاراکتر باشد
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/admin/categories" className="flex-1">
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

