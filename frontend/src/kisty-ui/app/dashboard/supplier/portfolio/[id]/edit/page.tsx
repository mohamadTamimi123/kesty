"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "../../../../../components/Button";
import Input from "../../../../../components/Input";
import { UpdatePortfolioData, Portfolio, QuantityRange } from "../../../../../types/portfolio";
import { Category } from "../../../../../types/category";
import { Machine } from "../../../../../types/machine";
import { Material } from "../../../../../types/material";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../../utils/logger";
import {
  PhotoIcon,
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  GlobeAltIcon,
  EyeSlashIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function EditPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const portfolioId = params.id as string;
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [formData, setFormData] = useState<UpdatePortfolioData>({
    title: "",
    categoryId: "",
    subcategoryId: undefined,
    completionDate: "",
    quantityRange: undefined,
    description: "",
    customerName: "",
    isPublic: true,
    machineIds: [],
    materialIds: [],
    images: [],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/dashboard/supplier/portfolio/${portfolioId}/edit`);
      return;
    }
  }, [isAuthenticated, router, portfolioId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const [portfolio, categoriesData, machinesData, materialsData] = await Promise.all([
          apiClient.getPortfolioById(portfolioId),
          apiClient.getActiveCategories(),
          apiClient.getMachines(),
          apiClient.getMachines(), // TODO: Replace with getMaterials when available
        ]);

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setMachines(Array.isArray(machinesData) ? machinesData : []);
        setMaterials(Array.isArray(materialsData) ? materialsData : []);

        // Populate form with portfolio data
        setFormData({
          title: portfolio.title,
          categoryId: portfolio.categoryId,
          subcategoryId: portfolio.subcategoryId,
          completionDate: portfolio.completionDate.split("T")[0],
          quantityRange: portfolio.quantityRange,
          description: portfolio.description,
          customerName: portfolio.customerName || "",
          isPublic: portfolio.isPublic,
          machineIds: portfolio.machines?.map((m) => m.id) || [],
          materialIds: portfolio.materials?.map((m) => m.id) || [],
          images: portfolio.images?.map((img) => ({
            imageUrl: img.imageUrl,
            order: img.order,
            isPrimary: img.isPrimary,
          })) || [],
        });

        setSelectedCategoryId(portfolio.categoryId);
        const existingUrls = portfolio.images?.map((img) => img.imageUrl) || [];
        setExistingImageUrls(existingUrls);
        setImagePreviews(existingUrls);
      } catch (error) {
        logger.error("Error fetching portfolio data", error);
        toast.error("خطا در بارگذاری اطلاعات نمونه کار");
        router.push("/dashboard/supplier/portfolio");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isAuthenticated && portfolioId) {
      fetchData();
    }
  }, [isAuthenticated, portfolioId, router]);

  const handleChange = (field: keyof UpdatePortfolioData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("فقط فایل‌های تصویری مجاز است");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم فایل باید کمتر از 5MB باشد");
        return false;
      }
      return true;
    });

    const newFiles = [...imageFiles, ...validFiles];
    setImageFiles(newFiles);

    // Create previews for new files (base64)
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    // Calculate which file to remove (only from new files, not existing)
    const existingCount = existingImageUrls.length;
    if (index < existingCount) {
      // Removing existing image
      setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Removing new file
      const fileIndex = index - existingCount;
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    
    // Update previews
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    const [primary] = newPreviews.splice(index, 1);
    newPreviews.unshift(primary);
    setImagePreviews(newPreviews);

    // Update existing URLs if needed
    const existingCount = existingImageUrls.length;
    if (index < existingCount) {
      const newExisting = [...existingImageUrls];
      const [primaryUrl] = newExisting.splice(index, 1);
      newExisting.unshift(primaryUrl);
      setExistingImageUrls(newExisting);
    } else {
      // Moving a new file to primary
      const fileIndex = index - existingCount;
      const newFiles = [...imageFiles];
      if (newFiles.length > fileIndex) {
        const [primaryFile] = newFiles.splice(fileIndex, 1);
        newFiles.unshift(primaryFile);
        setImageFiles(newFiles);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = "عنوان الزامی است";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "دسته‌بندی الزامی است";
    }

    if (!formData.completionDate) {
      newErrors.completionDate = "تاریخ تکمیل الزامی است";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "توضیحات الزامی است";
    }

    if (imagePreviews.length === 0) {
      newErrors.images = "حداقل یک تصویر الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("لطفا تمام فیلدهای الزامی را پر کنید");
      return;
    }

    setIsLoading(true);

    try {
      // Upload new images if there are any
      let uploadedImageUrls: string[] = [];
      
      if (imageFiles.length > 0) {
        toast.loading("در حال آپلود تصاویر جدید...", { id: "upload" });
        try {
          uploadedImageUrls = await apiClient.uploadPortfolioImages(imageFiles);
          toast.success("تصاویر جدید با موفقیت آپلود شدند", { id: "upload" });
        } catch (uploadError: unknown) {
          toast.error("خطا در آپلود تصاویر", { id: "upload" });
          logger.error("Error uploading images", uploadError);
          const uploadErrorMsg = (uploadError as any)?.response?.data?.message || "خطا در آپلود تصاویر";
          throw new Error(uploadErrorMsg);
        }
      }

      // Build final image URLs array
      // imagePreviews contains: existing URLs + base64 previews of new files
      // We need to replace base64 previews with uploaded URLs
      const finalImageUrls: string[] = [];
      let uploadedIndex = 0;
      
      for (const preview of imagePreviews) {
        if (existingImageUrls.includes(preview)) {
          // This is an existing URL, keep it
          finalImageUrls.push(preview);
        } else if (preview.startsWith('data:')) {
          // This is a base64 preview, replace with uploaded URL
          if (uploadedIndex < uploadedImageUrls.length) {
            finalImageUrls.push(uploadedImageUrls[uploadedIndex]);
            uploadedIndex++;
          }
        } else {
          // This is already a URL (shouldn't happen, but handle it)
          finalImageUrls.push(preview);
        }
      }

      const portfolioData: UpdatePortfolioData = {
        ...formData,
        images: finalImageUrls.map((url, index) => ({
          imageUrl: url,
          order: index,
          isPrimary: index === 0,
        })),
      };

      await apiClient.updatePortfolio(portfolioId, portfolioData);
      toast.success("نمونه کار با موفقیت به‌روزرسانی شد");
      router.push("/dashboard/supplier/portfolio");
    } catch (error: unknown) {
      logger.error("Error updating portfolio", error);
      let errorMessage = "خطا در به‌روزرسانی نمونه کار";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const axiosError = error as any;
        if (axiosError?.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.deletePortfolio(portfolioId);
      toast.success("نمونه کار با موفقیت حذف شد");
      router.push("/dashboard/supplier/portfolio");
    } catch (error: unknown) {
      logger.error("Error deleting portfolio", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در حذف نمونه کار";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const subcategories = categories.filter(
    (cat) => cat.parentId === selectedCategoryId
  );

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-center text-brand-medium-blue py-12">
          در حال بارگذاری...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/supplier/portfolio"
            className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-block"
          >
            ← بازگشت به لیست نمونه کارها
          </Link>
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            ویرایش نمونه کار
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات نمونه کار خود را ویرایش کنید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
              اطلاعات پایه
            </h2>
            <div className="space-y-4">
              <Input
                type="text"
                name="title"
                label="عنوان نمونه کار"
                placeholder="مثال: ساخت درب فلزی"
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                error={errors.title}
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  دسته‌بندی <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId || ""}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    handleChange("categoryId", e.target.value);
                    handleChange("subcategoryId", undefined);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.categoryId
                      ? "border-red-500"
                      : "border-brand-medium-gray"
                  } focus:outline-none focus:ring-2 focus:ring-brand-medium-blue`}
                  required
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories
                    .filter((cat) => !cat.parentId)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>
                )}
              </div>

              {subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                    زیردسته‌بندی
                  </label>
                  <select
                    value={formData.subcategoryId || ""}
                    onChange={(e) =>
                      handleChange("subcategoryId", e.target.value || undefined)
                    }
                    className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                  >
                    <option value="">انتخاب زیردسته‌بندی</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                type="date"
                name="completionDate"
                label="تاریخ تکمیل"
                icon={<CalendarIcon className="w-5 h-5" />}
                iconPosition="start"
                value={formData.completionDate || ""}
                onChange={(e) => handleChange("completionDate", e.target.value)}
                error={errors.completionDate}
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  محدوده تعداد
                </label>
                <select
                  value={formData.quantityRange || ""}
                  onChange={(e) =>
                    handleChange(
                      "quantityRange",
                      e.target.value ? (e.target.value as QuantityRange) : undefined
                    )
                  }
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="">انتخاب محدوده</option>
                  <option value={QuantityRange.LESS_THAN_100}>کمتر از 100</option>
                  <option value={QuantityRange.BETWEEN_100_1000}>
                    بین 100 تا 1000
                  </option>
                  <option value={QuantityRange.MORE_THAN_1000}>
                    بیشتر از 1000
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
              توضیحات
            </h2>
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                توضیحات نمونه کار <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg ${
                  errors.description
                    ? "border-red-500"
                    : "border-brand-medium-gray"
                } focus:outline-none focus:ring-2 focus:ring-brand-medium-blue`}
                placeholder="توضیحات کامل درباره نمونه کار..."
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Images */}
          <div>
            <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
              تصاویر
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  آپلود تصاویر <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-brand-medium-gray rounded-lg p-6 text-center">
                  <PhotoIcon className="w-12 h-12 text-brand-medium-gray mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-brand-medium-blue hover:text-brand-dark-blue">
                      کلیک برای افزودن تصاویر جدید
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-brand-medium-gray mt-2">
                    فرمت‌های مجاز: JPG, PNG (حداکثر 5MB هر تصویر)
                  </p>
                </div>
                {errors.images && (
                  <p className="mt-1 text-xs text-red-500">{errors.images}</p>
                )}
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative group border border-brand-medium-gray rounded-lg overflow-hidden"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          اصلی
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="opacity-0 group-hover:opacity-100 bg-white text-brand-dark-blue p-2 rounded hover:bg-brand-off-white"
                          disabled={index === 0}
                        >
                          <TagIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Machines and Materials */}
          <div>
            <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
              دستگاه‌ها و متریال‌ها
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  دستگاه‌های استفاده شده
                </label>
                <select
                  multiple
                  value={formData.machineIds || []}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    handleChange("machineIds", selected);
                  }}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue h-32"
                >
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-brand-medium-gray mt-1">
                  برای انتخاب چندتایی، Ctrl (یا Cmd در Mac) را نگه دارید
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  متریال‌های استفاده شده
                </label>
                <select
                  multiple
                  value={formData.materialIds || []}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    handleChange("materialIds", selected);
                  }}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue h-32"
                >
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-brand-medium-gray mt-1">
                  برای انتخاب چندتایی، Ctrl (یا Cmd در Mac) را نگه دارید
                </p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
              اطلاعات مشتری (اختیاری)
            </h2>
            <Input
              type="text"
              name="customerName"
              label="نام مشتری"
              placeholder="نام مشتری را وارد کنید"
              value={formData.customerName || ""}
              onChange={(e) => handleChange("customerName", e.target.value)}
            />
          </div>

          {/* Privacy Settings */}
          <div>
            <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
              تنظیمات حریم خصوصی
            </h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic ?? true}
                  onChange={(e) => handleChange("isPublic", e.target.checked)}
                  className="w-4 h-4 text-brand-medium-blue rounded focus:ring-brand-medium-blue"
                />
                <div className="flex items-center gap-2">
                  {formData.isPublic ? (
                    <GlobeAltIcon className="w-5 h-5 text-brand-medium-blue" />
                  ) : (
                    <EyeSlashIcon className="w-5 h-5 text-brand-medium-gray" />
                  )}
                  <span className="text-brand-dark-blue">
                    نمونه کار عمومی باشد
                  </span>
                </div>
              </label>
            </div>
            <p className="text-xs text-brand-medium-gray mt-2">
              نمونه کارهای عمومی در پروفایل شما نمایش داده می‌شوند
            </p>
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-brand-medium-gray">
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
              disabled={isLoading}
            >
              انصراف
            </Button>
            <div className="flex-1"></div>
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              disabled={isLoading}
            >
              <TrashIcon className="w-4 h-4 ml-2" />
              حذف نمونه کار
            </Button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-brand-dark-blue mb-4">
              حذف نمونه کار
            </h3>
            <p className="text-brand-medium-blue mb-6">
              آیا از حذف نمونه کار "{formData.title}" اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
                className="flex-1"
              >
                حذف
              </Button>
              <Button
                variant="neutral"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

