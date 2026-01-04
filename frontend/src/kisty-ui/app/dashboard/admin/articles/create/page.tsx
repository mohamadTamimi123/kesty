"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileLayout from "../../../../components/MobileLayout";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import ReactQuillWrapper from "../../../../components/ReactQuillWrapper";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import { Category } from "../../../../types/category";
import {
  PhotoIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

export default function CreateArticlePage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    categoryId: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    isPublished: false,
    scheduledPublishDate: "",
  });

  // Rich text editor modules configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "script",
    "indent",
    "direction",
    "color",
    "background",
    "align",
    "link",
    "image",
    "video",
  ];

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

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const cats = await apiClient.getActiveCategories();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (error) {
        logger.error("Error fetching categories", error);
      }
    };

    fetchCategories();
  }, [isAuthenticated, currentUser, router]);

  const generateSlug = (title: string) => {
    if (!title || title.trim() === '') {
      return '';
    }
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: formData.slug || generateSlug(value),
      metaTitle: formData.metaTitle || value,
    });
  };

  const getImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    const apiUrl = typeof window !== 'undefined' 
      ? window.location.origin.replace(':3000', ':3001')
      : 'http://localhost:3001';
    const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    if (path.startsWith('/api/')) {
      return `${apiUrl}${path}`;
    }
    return `${apiUrl}/api${path}`;
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل‌های تصویری مجاز است");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم فایل باید کمتر از 5MB باشد");
      return;
    }

    setIsUploadingImage(true);
    setFeaturedImageFile(file);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeaturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("تصویر انتخاب شد");
    } catch (error: unknown) {
      logger.error("Error processing image", error);
      toast.error("خطا در پردازش تصویر");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeFeaturedImage = () => {
    setFeaturedImage(null);
    setFeaturedImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      toast.error("کاربر شناسایی نشد");
      return;
    }

    try {
      setIsLoading(true);

      // Upload featured image if exists
      let featuredImageUrl: string | null = null;
      if (featuredImageFile) {
        try {
          const result = await apiClient.uploadArticleFeaturedImage(featuredImageFile);
          featuredImageUrl = result.imageUrl || null;
        } catch (uploadError) {
          logger.error("Error uploading featured image", uploadError);
          toast.error("خطا در آپلود تصویر شاخص");
        }
      }

      // Validate title first
      if (!formData.title || formData.title.trim() === '') {
        toast.error("عنوان مقاله الزامی است");
        setIsLoading(false);
        return;
      }

      // Generate slug if not provided or empty - ensure it's always a valid string
      let slug = formData.slug && formData.slug.trim() ? formData.slug.trim() : generateSlug(formData.title);
      
      // Ensure slug is never empty - regenerate from title if needed
      if (!slug || slug.trim() === '') {
        slug = generateSlug(formData.title);
      }
      
      // Final validation - slug must exist
      if (!slug || slug.trim() === '') {
        toast.error("خطا در تولید آدرس مقاله");
        setIsLoading(false);
        return;
      }
      
      const articleData: any = {
        title: formData.title.trim(),
        slug: slug.trim(), // Slug is required, always provide it
        content: formData.content,
        authorId: currentUser.id,
        isPublished: formData.isPublished || false,
      };

      // Add optional fields only if they have values
      if (formData.excerpt) {
        articleData.excerpt = formData.excerpt;
      }
      if (featuredImageUrl) {
        articleData.featuredImage = featuredImageUrl;
      }
      if (formData.categoryId) {
        articleData.categoryId = formData.categoryId;
      }
      if (formData.metaTitle) {
        articleData.metaTitle = formData.metaTitle;
      }
      if (formData.metaDescription) {
        articleData.metaDescription = formData.metaDescription;
      }

      await apiClient.createEducationalArticle(articleData);
      toast.success("مقاله با موفقیت ایجاد شد");
      router.push("/dashboard/admin/articles");
    } catch (error: any) {
      logger.error("Error creating article", error);
      toast.error(error.response?.data?.message || "خطا در ایجاد مقاله");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-6">
          نوشتن مقاله جدید
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <h2 className="text-lg font-bold text-brand-dark-blue mb-4">اطلاعات اصلی</h2>

            <div className="space-y-4">
              <Input
                label="عنوان مقاله"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="عنوان مقاله را وارد کنید"
              />

              <Input
                label="اسلاگ (URL)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="slug-article"
                helpText="اگر خالی بگذارید، به صورت خودکار از عنوان ساخته می‌شود"
              />

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  دسته‌بندی
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  عکس شاخص
                </label>
                {featuredImage ? (
                  <div className="relative w-full max-w-md">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-brand-medium-gray">
                      <Image
                        src={featuredImage}
                        alt="Featured"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeFeaturedImage}
                      className="absolute top-2 left-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-brand-medium-gray rounded-lg p-8 text-center">
                    <PhotoIcon className="w-12 h-12 text-brand-medium-gray mx-auto mb-4" />
                    <label className="cursor-pointer">
                      <span className="text-brand-medium-blue hover:text-brand-dark-blue">
                        کلیک کنید یا تصویر را اینجا بکشید
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFeaturedImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-brand-medium-gray mt-2">
                      فرمت‌های مجاز: JPG, PNG, GIF (حداکثر 5MB)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  خلاصه مقاله
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
                  placeholder="خلاصه کوتاهی از مقاله..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  محتوای مقاله
                </label>
                <div className="border border-brand-medium-gray rounded-lg overflow-hidden">
                  <ReactQuillWrapper
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="محتوای مقاله را اینجا بنویسید..."
                    className="bg-white"
                  />
                </div>
                <p className="text-xs text-brand-medium-gray mt-2">
                  می‌توانید عکس، ویدیو، جداول و لیست‌ها را در محتوا درج کنید
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <h2 className="text-lg font-bold text-brand-dark-blue mb-4">SEO</h2>

            <div className="space-y-4">
              <Input
                label="عنوان متا (Meta Title)"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="عنوان برای موتورهای جستجو"
              />

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  توضیحات متا (Meta Description)
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
                  placeholder="توضیحات برای موتورهای جستجو"
                />
              </div>

              <Input
                label="کلمات کلیدی (Keywords)"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="کلمه کلیدی 1، کلمه کلیدی 2، ..."
                helpText="کلمات کلیدی را با کاما جدا کنید"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <h2 className="text-lg font-bold text-brand-dark-blue mb-4">تنظیمات انتشار</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className="w-4 h-4 text-brand-medium-blue border-brand-medium-gray rounded focus:ring-brand-medium-blue"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-brand-dark-blue">
                  منتشر کردن مقاله
                </label>
              </div>

              {formData.isPublished && (
                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    <CalendarIcon className="w-4 h-4 inline ml-1" />
                    زمان‌بندی انتشار (اختیاری)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledPublishDate}
                    onChange={(e) => setFormData({ ...formData, scheduledPublishDate: e.target.value })}
                    className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
                  />
                  <p className="text-xs text-brand-medium-gray mt-1">
                    اگر خالی بگذارید، مقاله بلافاصله منتشر می‌شود
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
              {isLoading ? "در حال ذخیره..." : "ذخیره مقاله"}
            </Button>
            <Button
              type="button"
              variant="neutral"
              onClick={() => router.back()}
              className="flex-1"
            >
              انصراف
            </Button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}

