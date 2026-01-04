"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, DocumentTextIcon, PhotoIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../components/MobileLayout";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import { CreateCityData } from "../../../../types/city";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";


import { getErrorMessage } from "../../../../utils/errorHandler";

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

export default function CreateCityPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<CreateCityData>({
    title: "",
    slug: "",
    description: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCityData, string>>>({});
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

  // Auto-generate slug when title changes
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const autoSlug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.title]);

  const handleChange = (field: keyof CreateCityData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateCityData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان الزامی است";
    } else if (formData.title.length < 2) {
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
      await apiClient.createCity({
        title: formData.title,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        logo: logoFile || undefined,
      });

      toast.success(`شهر ${formData.title} با موفقیت ایجاد شد`);
      router.push("/dashboard/admin/cities");
    } catch (error: unknown) {
      logger.error("Error creating city", error);
      toast.error(getErrorMessage(error) || "خطا در ایجاد شهر");
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin/cities"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowRightIcon className="w-4 h-4 ml-1" />
            بازگشت به لیست شهرها
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
            افزودن شهر جدید
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات شهر جدید را وارد کنید
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
              placeholder="نام شهر را وارد کنید"
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
                placeholder="توضیحات شهر را وارد کنید (اختیاری)"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="logo"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                لوگو
              </label>
              <div className="space-y-3">
                {logoPreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-brand-medium-gray">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="logo"
                    className="flex items-center gap-2 px-4 py-2 border border-brand-medium-gray rounded-lg cursor-pointer hover:bg-brand-light-gray transition-colors"
                  >
                    <PhotoIcon className="w-5 h-5 text-brand-medium-blue" />
                    <span className="text-sm text-brand-dark-blue">
                      {logoFile ? logoFile.name : "انتخاب فایل لوگو"}
                    </span>
                  </label>
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  {logoFile && (
                    <Button
                      type="button"
                      variant="neutral"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      حذف
                    </Button>
                  )}
                </div>
                <p className="text-xs text-brand-medium-blue">
                  فرمت‌های مجاز: JPG, PNG, WebP | حداکثر حجم: 5 مگابایت
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/admin/cities" className="flex-1">
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
                ایجاد شهر
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
}

