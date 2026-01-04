"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, DocumentTextIcon, PhotoIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../../components/MobileLayout";
import Button from "../../../../../components/Button";
import Input from "../../../../../components/Input";
import { UpdateCityData, City } from "../../../../../types/city";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../../utils/logger";

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

const getLogoUrl = (logoUrl: string | null) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  // API serves static files at /api/uploads/...
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';
  // logoUrl should be like /uploads/cities/filename.png
  // We need to convert it to /api/uploads/cities/filename.png
  const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
  return `${apiUrl}/api${path}`;
};

export default function EditCityPage() {
  const router = useRouter();
  const params = useParams();
  const cityId = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [city, setCity] = useState<City | null>(null);
  const [formData, setFormData] = useState<UpdateCityData>({
    title: "",
    slug: "",
    description: "",
    isActive: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateCityData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(true);

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

  // Load city data
  useEffect(() => {
    const fetchCity = async () => {
      try {
        setIsLoadingCity(true);
        const cityData = await apiClient.getCityById(cityId);
        setCity(cityData);
        setFormData({
          title: cityData.title,
          slug: cityData.slug,
          description: cityData.description || "",
          isActive: cityData.isActive,
        });
        
        // Set logo preview if exists
        if (cityData.logoUrl) {
          const logoUrl = getLogoUrl(cityData.logoUrl);
          if (logoUrl) {
            setLogoPreview(logoUrl);
          }
        }
      } catch (error: unknown) {
        logger.error("Error fetching city", error);
        toast.error(error.response?.data?.message || "خطا در دریافت اطلاعات شهر");
        router.push("/dashboard/admin/cities");
      } finally {
        setIsLoadingCity(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN") && cityId) {
      fetchCity();
    }
  }, [isAuthenticated, currentUser, cityId, router]);

  // Auto-generate slug when title changes (only if slug is empty or matches old title)
  useEffect(() => {
    if (formData.title && city && (!formData.slug || formData.slug === generateSlug(city.title))) {
      const autoSlug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.title, city]);

  const handleChange = (field: keyof UpdateCityData, value: string | boolean) => {
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
    const newErrors: Partial<Record<keyof UpdateCityData, string>> = {};

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
      await apiClient.updateCity(cityId, {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        isActive: formData.isActive,
        logo: logoFile || undefined,
      });

      toast.success(`شهر ${formData.title} با موفقیت به‌روزرسانی شد`);
      router.push("/dashboard/admin/cities");
    } catch (error: unknown) {
      logger.error("Error updating city", error);
      toast.error(error.response?.data?.message || "خطا در به‌روزرسانی شهر");
      setIsLoading(false);
    }
  };

  if (isLoadingCity) {
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

  if (!city) {
    return null;
  }

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
            ویرایش شهر
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات شهر را ویرایش کنید
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
                      {logoFile ? logoFile.name : city.logoUrl ? "تغییر لوگو" : "انتخاب فایل لوگو"}
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
                  {(logoFile || city.logoUrl) && (
                    <Button
                      type="button"
                      variant="neutral"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(city.logoUrl ? getLogoUrl(city.logoUrl) : null);
                      }}
                    >
                      بازنشانی
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
                ذخیره تغییرات
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
}

