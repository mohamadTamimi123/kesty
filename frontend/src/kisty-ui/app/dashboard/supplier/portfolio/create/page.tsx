"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../../components/MobileLayout";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import {
  CreatePortfolioData,
  QuantityRange,
} from "../../../../types/portfolio";
import { Category } from "../../../../types/category";
import { Machine } from "../../../../types/machine";
import { Material } from "../../../../types/material";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import {
  PhotoIcon,
  XMarkIcon,
  PlusCircleIcon,
  CalendarIcon,
  TagIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  GlobeAltIcon,
  EyeSlashIcon,
  EyeIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  const apiUrl =
    typeof window !== "undefined"
      ? window.location.origin.replace(":3000", ":3001")
      : "http://localhost:3001";
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  // Handle both /api/uploads/... and /uploads/... formats
  if (path.startsWith("/api/")) {
    return `${apiUrl}${path}`;
  }
  return `${apiUrl}/api${path}`;
};

export default function CreatePortfolioPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, boolean>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [formData, setFormData] = useState<CreatePortfolioData>({
    title: "",
    categoryId: "",
    subcategoryId: undefined,
    projectId: undefined,
    completionDate: "",
    quantityRange: undefined,
    description: "",
    customerName: "",
    customerId: undefined,
    isPublic: true,
    machineIds: [],
    materialIds: [],
    images: [],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    avatarUrl?: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [requestReviewFromCustomer, setRequestReviewFromCustomer] =
    useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/supplier/portfolio/create");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, machinesData, materialsData] = await Promise.all(
          [
            apiClient.getActiveCategories(),
            apiClient.getMachines(),
            apiClient.getMaterials(),
          ],
        );

        // Sort categories by title
        const sortedCategories = Array.isArray(categoriesData)
          ? [...categoriesData].sort((a, b) =>
              a.title.localeCompare(b.title, "fa"),
            )
          : [];
        setCategories(sortedCategories);
        setMachines(Array.isArray(machinesData) ? machinesData : []);
        setMaterials(Array.isArray(materialsData) ? materialsData : []);
      } catch (error) {
        logger.error("Error fetching form data", error);
        toast.error("خطا در بارگذاری اطلاعات فرم");
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleChange = (field: keyof CreatePortfolioData, value: any) => {
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

    if (validFiles.length === 0) {
      // Reset input
      e.target.value = '';
      return;
    }

    const startIndex = imageFiles.length;
    const newFiles = [...imageFiles, ...validFiles];
    setImageFiles(newFiles);

    // Set loading states for new images
    const newLoadingStates: Record<number, boolean> = {};
    validFiles.forEach((_, index) => {
      newLoadingStates[startIndex + index] = true;
    });
    setImageLoadingStates((prev) => ({ ...prev, ...newLoadingStates }));

    // Create previews
    const previewPromises = validFiles.map((file, index) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            // Clear loading state for this image
            setImageLoadingStates((prev) => {
              const updated = { ...prev };
              delete updated[startIndex + index];
              return updated;
            });
            resolve(reader.result);
          } else {
            setImageLoadingStates((prev) => {
              const updated = { ...prev };
              delete updated[startIndex + index];
              return updated;
            });
            resolve('');
          }
        };
        reader.onerror = () => {
          toast.error(`خطا در خواندن تصویر: ${file.name}`);
          setImageLoadingStates((prev) => {
            const updated = { ...prev };
            delete updated[startIndex + index];
            return updated;
          });
          resolve('');
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then((previews) => {
      const validPreviews = previews.filter((p) => p !== '');
      setImagePreviews((prev) => [...prev, ...validPreviews]);
    });

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageLoadingStates((prev) => {
      const updated = { ...prev };
      delete updated[index];
      // Reindex remaining states
      const reindexed: Record<number, boolean> = {};
      Object.keys(updated).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = updated[oldIndex];
        } else if (oldIndex < index) {
          reindexed[oldIndex] = updated[oldIndex];
        }
      });
      return reindexed;
    });
  };

  const setPrimaryImage = (index: number) => {
    const newImages = [...imagePreviews];
    const [primary] = newImages.splice(index, 1);
    newImages.unshift(primary);
    setImagePreviews(newImages);

    const newFiles = [...imageFiles];
    const [primaryFile] = newFiles.splice(index, 1);
    newFiles.unshift(primaryFile);
    setImageFiles(newFiles);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان الزامی است";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "عنوان باید حداقل 3 کاراکتر باشد";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "دسته‌بندی الزامی است";
    }

    if (!formData.completionDate) {
      newErrors.completionDate = "تاریخ تکمیل الزامی است";
    } else {
      // Validate date is not in the future
      const selectedDate = new Date(formData.completionDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.completionDate = "تاریخ تکمیل نمی‌تواند در آینده باشد";
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = "توضیحات الزامی است";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "توضیحات باید حداقل 10 کاراکتر باشد";
    }

    if (!formData.quantityRange) {
      newErrors.quantityRange = "محدوده تعداد الزامی است";
    }

    if (imageFiles.length === 0) {
      newErrors.images = "حداقل یک تصویر الزامی است";
    } else if (imageFiles.length > 20) {
      newErrors.images = "حداکثر 20 تصویر می‌توانید آپلود کنید";
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

    // Prevent double submission
    if (isLoading || isUploadingImages) {
      return;
    }

    setIsLoading(true);
    setIsUploadingImages(false);
    setUploadProgress(0);

    try {
      // Upload images first if there are new files to upload
      let imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        setIsUploadingImages(true);
        setUploadProgress(0);
        const uploadToastId = toast.loading(
          `در حال آپلود ${imageFiles.length} تصویر...`,
          { id: "upload" }
        );

        try {
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) return prev;
              return prev + 10;
            });
          }, 200);

          imageUrls = await apiClient.uploadPortfolioImages(imageFiles);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          toast.success(
            `${imageUrls.length} تصویر با موفقیت آپلود شد`,
            { id: uploadToastId }
          );
        } catch (uploadError: unknown) {
          setIsUploadingImages(false);
          setUploadProgress(0);
          logger.error("Error uploading images", uploadError);
          
          const uploadErrorMsg =
            (uploadError as any)?.response?.data?.message ||
            "خطا در آپلود تصاویر";
          
          toast.error(uploadErrorMsg, { id: "upload" });
          setIsLoading(false);
          return;
        } finally {
          setIsUploadingImages(false);
          setUploadProgress(0);
        }
      }

      // Validate required fields again (double check)
      if (!formData.quantityRange) {
        setErrors({ quantityRange: "لطفا تعداد/سری تولید را انتخاب کنید" });
        toast.error("لطفا تعداد/سری تولید را انتخاب کنید");
        setIsLoading(false);
        return;
      }

      if (imageUrls.length === 0 && imageFiles.length === 0) {
        setErrors({ images: "حداقل یک تصویر الزامی است" });
        toast.error("حداقل یک تصویر الزامی است");
        setIsLoading(false);
        return;
      }

      // Show creating toast
      const createToastId = toast.loading("در حال ایجاد نمونه کار...", {
        id: "create",
      });

      // Prepare portfolio data, only including fields that have values
      const portfolioData: CreatePortfolioData = {
        title: formData.title.trim(),
        categoryId: formData.categoryId,
        completionDate: formData.completionDate,
        quantityRange: formData.quantityRange, // Required
        description: formData.description.trim(),
        isPublic: formData.isPublic ?? true,
        // Only include optional fields if they have values
        ...(formData.subcategoryId && {
          subcategoryId: formData.subcategoryId,
        }),
        ...(formData.projectId && { projectId: formData.projectId }),
        ...(formData.customerName?.trim() && {
          customerName: formData.customerName.trim(),
        }),
        ...(formData.customerId && { customerId: formData.customerId }),
        // Only include arrays if they have values
        ...(formData.machineIds &&
          formData.machineIds.length > 0 && {
            machineIds: formData.machineIds,
          }),
        ...(formData.materialIds &&
          formData.materialIds.length > 0 && {
            materialIds: formData.materialIds,
          }),
        // Include images with uploaded URLs (minimum 1 required)
        ...(imageUrls.length > 0 && {
          images: imageUrls.map((url, index) => ({
            imageUrl: url,
            order: index,
            isPrimary: index === 0,
          })),
        }),
      };

      logger.info("Creating portfolio with data:", {
        ...portfolioData,
        images: portfolioData.images?.length || 0,
      });

      const createdPortfolio = await apiClient.createPortfolio(portfolioData);
      
      toast.success("نمونه کار با موفقیت ایجاد شد", { id: createToastId });

      // If request review is enabled and customer is selected, send review request
      if (
        requestReviewFromCustomer &&
        selectedCustomer &&
        createdPortfolio?.id
      ) {
        try {
          await apiClient.createReviewRequest({
            portfolioId: createdPortfolio.id,
            customerId: selectedCustomer.id,
            message: `لطفا نظر خود را درباره پروژه "${formData.title}" ثبت کنید.`,
          });
          toast.success("درخواست نظر با موفقیت ارسال شد");
        } catch (reviewError: unknown) {
          logger.error("Error creating review request", reviewError);
          // Don't show error toast here as portfolio was created successfully
          // Just log the error
        }
      }

      // Small delay before redirect for better UX
      setTimeout(() => {
        router.push("/dashboard/supplier/portfolio");
      }, 500);
    } catch (error: unknown) {
      logger.error("Error creating portfolio", error);
      const axiosError = error as any;
      let errorMessage = "خطا در ایجاد نمونه کار";

      if (axiosError?.response) {
        // Try to get detailed error message
        const responseData = axiosError.response.data;
        if (responseData?.message) {
          errorMessage = Array.isArray(responseData.message)
            ? responseData.message.join(", ")
            : responseData.message;
        } else if (responseData?.error) {
          errorMessage = Array.isArray(responseData.error)
            ? responseData.error.join(", ")
            : responseData.error;
        } else if (axiosError.response.status === 500) {
          errorMessage =
            "خطای سرور. لطفا دوباره تلاش کنید یا با پشتیبانی تماس بگیرید";
        } else if (axiosError.response.status === 400) {
          errorMessage = "اطلاعات وارد شده معتبر نیست. لطفا بررسی کنید.";
        } else if (axiosError.response.status === 401) {
          errorMessage = "لطفا دوباره وارد شوید";
          router.push("/login");
        }
        logger.error("Error response:", {
          status: axiosError.response.status,
          data: responseData,
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
      setIsLoading(false);
    }
  };

  const subcategories = categories
    .filter((cat) => cat.parentId === selectedCategoryId)
    .sort((a, b) => a.title.localeCompare(b.title, "fa"));

  const errorCount = Object.keys(errors).filter((key) => errors[key]).length;

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/supplier/portfolio"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            ← بازگشت به لیست نمونه کارها
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
            ثبت نمونه کار جدید
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات نمونه کار خود را وارد کنید
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
                اطلاعات پایه
              </h2>
              <div className="space-y-4 mt-4">
                <Input
                  type="text"
                  name="title"
                  label="عنوان نمونه کار"
                  placeholder="مثال: ساخت درب فلزی"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  error={errors.title}
                  required
                  disabled={isLoading || isUploadingImages}
                />

                <div>
                  <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                    دسته‌بندی <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      handleChange("categoryId", e.target.value);
                      handleChange("subcategoryId", undefined);
                    }}
                    disabled={isLoading || isUploadingImages}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.categoryId
                        ? "border-red-500 focus:ring-red-500"
                        : "border-brand-medium-gray focus:ring-brand-medium-blue focus:border-brand-medium-blue"
                    } ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed bg-gray-50" : ""} text-brand-dark-blue`}
                    required
                  >
                    <option value="">انتخاب دسته‌بندی</option>
                    {categories
                      .filter((cat) => !cat.parentId)
                      .sort((a, b) => a.title.localeCompare(b.title, "fa"))
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.title}
                        </option>
                      ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.categoryId}
                    </p>
                  )}
                </div>

                {subcategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                      زیردسته‌بندی
                      <span className="text-xs text-brand-medium-gray mr-2">
                        (اختیاری)
                      </span>
                    </label>
                    <select
                      value={formData.subcategoryId || ""}
                      onChange={(e) =>
                        handleChange(
                          "subcategoryId",
                          e.target.value || undefined,
                        )
                      }
                      disabled={isLoading || isUploadingImages}
                      className={`w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed bg-gray-50" : ""} text-brand-dark-blue`}
                    >
                      <option value="">انتخاب زیردسته‌بندی</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          └ {subcategory.title}
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
                  value={formData.completionDate}
                  onChange={(e) =>
                    handleChange("completionDate", e.target.value)
                  }
                  error={errors.completionDate}
                  required
                  disabled={isLoading || isUploadingImages}
                />

                <div>
                  <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                    محدوده تعداد <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.quantityRange || ""}
                    onChange={(e) =>
                      handleChange(
                        "quantityRange",
                        e.target.value
                          ? (e.target.value as QuantityRange)
                          : undefined,
                      )
                    }
                    disabled={isLoading || isUploadingImages}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.quantityRange
                        ? "border-red-500 focus:ring-red-500"
                        : "border-brand-medium-gray focus:ring-brand-medium-blue focus:border-brand-medium-blue"
                    } ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed bg-gray-50" : ""} text-brand-dark-blue`}
                    required
                  >
                    <option value="">انتخاب محدوده</option>
                    <option value={QuantityRange.LESS_THAN_100}>
                      کمتر از 100
                    </option>
                    <option value={QuantityRange.BETWEEN_100_1000}>
                      بین 100 تا 1000
                    </option>
                    <option value={QuantityRange.MORE_THAN_1000}>
                      بیشتر از 1000
                    </option>
                  </select>
                  {errors.quantityRange && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.quantityRange}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-brand-medium-gray pt-6">
              <h2 className="text-lg font-semibold text-brand-dark-blue mb-4">
                توضیحات
              </h2>
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  توضیحات نمونه کار <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  disabled={isLoading || isUploadingImages}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.description
                      ? "border-red-500 focus:ring-red-500"
                      : "border-brand-medium-gray focus:ring-brand-medium-blue focus:border-brand-medium-blue"
                  } ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed bg-gray-50" : ""} text-brand-dark-blue resize-none`}
                  placeholder="توضیحات کامل درباره نمونه کار..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="border-t border-brand-medium-gray pt-6">
              <h2 className="text-lg font-semibold text-brand-dark-blue mb-4">
                تصاویر
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                    آپلود تصاویر <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-brand-medium-gray rounded-lg p-8 text-center hover:border-brand-medium-blue transition-colors">
                    <PhotoIcon className="w-12 h-12 text-brand-medium-gray mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-brand-medium-blue hover:text-brand-dark-blue transition-colors font-medium">
                        کلیک برای انتخاب تصاویر
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isLoading || isUploadingImages}
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
                  
                  {/* Upload Progress Indicator */}
                  {isUploadingImages && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm text-brand-medium-blue">
                        <span>در حال آپلود تصاویر...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-medium-blue h-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative group border border-brand-medium-gray rounded-lg overflow-hidden bg-white aspect-square"
                      >
                        {imageLoadingStates[index] ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                          </div>
                        ) : (
                          <>
                            <div className="relative w-full h-full bg-gray-50">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-contain"
                                loading="lazy"
                                onError={(e) => {
                                  console.error('Image preview error:', preview);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-100">خطا در بارگذاری</div>';
                                  }
                                }}
                                onLoad={(e) => {
                                  // Ensure image is visible
                                  const target = e.target as HTMLImageElement;
                                  target.style.opacity = '1';
                                  target.style.display = 'block';
                                }}
                                style={{
                                  display: 'block',
                                  opacity: 1,
                                }}
                              />
                            </div>
                            {index === 0 && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
                                اصلی
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(index)}
                                className="opacity-0 group-hover:opacity-100 bg-white text-brand-dark-blue p-2 rounded-lg hover:bg-brand-off-white transition-all shadow-md pointer-events-auto"
                                disabled={index === 0 || isLoading}
                                title="تنظیم به عنوان تصویر اصلی"
                              >
                                <TagIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all shadow-md pointer-events-auto"
                                disabled={isLoading}
                                title="حذف تصویر"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Machines and Materials */}
            <div className="border-t border-brand-medium-gray pt-6">
              <h2 className="text-lg font-semibold text-brand-dark-blue mb-4">
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
                        (option) => option.value,
                      );
                      handleChange("machineIds", selected);
                    }}
                    disabled={isLoading || isUploadingImages}
                    className={`w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue h-32 ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed bg-gray-50" : ""} text-brand-dark-blue`}
                  >
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-brand-medium-gray mt-2">
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
                        (option) => option.value,
                      );
                      handleChange("materialIds", selected);
                    }}
                    disabled={isLoading || isUploadingImages}
                    className={`w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue h-32 ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed bg-gray-50" : ""} text-brand-dark-blue`}
                  >
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-brand-medium-gray mt-2">
                    برای انتخاب چندتایی، Ctrl (یا Cmd در Mac) را نگه دارید
                  </p>
                </div>
              </div>
            </div>

            {/* Final Questions */}
            <div className="border-t border-brand-medium-gray pt-6">
              <h2 className="text-lg font-semibold text-brand-dark-blue mb-4">
                تنظیمات نهایی
              </h2>
              <div className="space-y-4">
                {/* Preview Toggle */}
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={isLoading || isUploadingImages}
                    className={`flex items-center gap-2 text-brand-medium-blue hover:text-brand-dark-blue transition-colors ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <EyeIcon className="w-5 h-5" />
                    <span className="font-medium">
                      {showPreview ? "مخفی کردن پیش‌نمایش" : "مشاهده پیش‌نمایش"}
                    </span>
                  </button>
                </div>

                {/* Public Display Question */}
                <div className="bg-brand-off-white rounded-lg p-4 border border-brand-medium-gray">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        handleChange("isPublic", e.target.checked)
                      }
                      disabled={isLoading || isUploadingImages}
                      className={`w-5 h-5 text-brand-medium-blue rounded focus:ring-brand-medium-blue focus:ring-2 focus:ring-offset-2 transition-all mt-0.5 ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {formData.isPublic ? (
                          <GlobeAltIcon className="w-5 h-5 text-brand-medium-blue transition-colors" />
                        ) : (
                          <EyeSlashIcon className="w-5 h-5 text-brand-medium-gray transition-colors" />
                        )}
                        <span className="text-brand-dark-blue font-medium">
                          آیا مایلید این پروژه در گالری عمومی پروفایل شما نمایش
                          داده شود؟
                        </span>
                      </div>
                      {formData.isPublic && showPreview && (
                        <div className="mt-3 p-3 bg-brand-off-white rounded-lg border border-brand-medium-gray/50">
                          <p className="text-xs text-brand-medium-blue mb-2">
                            پیش‌نمایش نمایش عمومی:
                          </p>
                          <div className="text-sm text-brand-dark-blue">
                            <p className="font-medium">{formData.title}</p>
                            {formData.categoryId && (
                              <p className="text-xs text-brand-medium-gray mt-1">
                                دسته:{" "}
                                {
                                  categories.find(
                                    (c) => c.id === formData.categoryId,
                                  )?.title
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Review Request Question */}
                {selectedCustomer && (
                  <div className="bg-brand-off-white rounded-lg p-4 border border-brand-medium-gray">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={requestReviewFromCustomer}
                        onChange={(e) =>
                          setRequestReviewFromCustomer(e.target.checked)
                        }
                        disabled={isLoading || isUploadingImages}
                        className={`w-5 h-5 text-brand-medium-blue rounded focus:ring-brand-medium-blue focus:ring-2 focus:ring-offset-2 transition-all mt-0.5 ${isLoading || isUploadingImages ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-600 transition-colors" />
                          <span className="text-brand-dark-blue font-medium">
                            آیا از مشتری این پروژه می‌خواهید برای شما نظر تأییدی
                            ثبت کند؟
                          </span>
                        </div>
                        {requestReviewFromCustomer && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700">
                              ✓ درخواست نظر برای {selectedCustomer.fullName}{" "}
                              ارسال خواهد شد
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="border-t border-brand-medium-gray pt-6">
                <h3 className="text-lg font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
                  پیش‌نمایش نمونه کار
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-brand-medium-gray mb-1">
                      عنوان:
                    </p>
                    <p className="text-base font-medium text-brand-dark-blue">
                      {formData.title || "-"}
                    </p>
                  </div>
                  {formData.categoryId && (
                    <div>
                      <p className="text-sm text-brand-medium-gray mb-1">
                        دسته‌بندی:
                      </p>
                      <p className="text-base text-brand-dark-blue">
                        {categories.find((c) => c.id === formData.categoryId)
                          ?.title || "-"}
                      </p>
                    </div>
                  )}
                  {formData.completionDate && (
                    <div>
                      <p className="text-sm text-brand-medium-gray mb-1">
                        تاریخ تکمیل:
                      </p>
                      <p className="text-base text-brand-dark-blue">
                        {new Date(formData.completionDate).toLocaleDateString(
                          "fa-IR",
                        )}
                      </p>
                    </div>
                  )}
                  {formData.description && (
                    <div>
                      <p className="text-sm text-brand-medium-gray mb-1">
                        توضیحات:
                      </p>
                      <p className="text-base text-brand-dark-blue">
                        {formData.description}
                      </p>
                    </div>
                  )}
                  {imagePreviews.length > 0 && (
                    <div>
                      <p className="text-sm text-brand-medium-gray mb-2">
                        تصاویر ({imagePreviews.length}):
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {imagePreviews.slice(0, 4).map((preview, index) => (
                          <img
                            key={index}
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-brand-medium-gray"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-3 border-t border-brand-medium-gray">
                    <p className="text-sm text-brand-medium-gray mb-1">
                      وضعیت:
                    </p>
                    <div className="flex items-center gap-2">
                      {formData.isPublic ? (
                        <>
                          <GlobeAltIcon className="w-5 h-5 text-brand-medium-blue" />
                          <span className="text-sm text-brand-dark-blue">
                            عمومی
                          </span>
                        </>
                      ) : (
                        <>
                          <EyeSlashIcon className="w-5 h-5 text-brand-medium-gray" />
                          <span className="text-sm text-brand-dark-blue">
                            خصوصی
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {errors.submit}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-brand-medium-gray">
              <div className="flex items-center gap-3">
                {errorCount > 0 && (
                  <div className="text-sm text-red-600 font-medium">
                    {errorCount} خطا در فرم
                  </div>
                )}
                {!errorCount && imageFiles.length > 0 && !isLoading && !isUploadingImages && (
                  <div className="text-sm text-brand-medium-blue">
                    {imageFiles.length} تصویر انتخاب شده
                  </div>
                )}
                {(isLoading || isUploadingImages) && (
                  <div className="text-sm text-brand-medium-blue animate-pulse">
                    {isUploadingImages ? "در حال آپلود تصاویر..." : "در حال ثبت نمونه کار..."}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/supplier/portfolio" className="flex-1">
                  <Button 
                    type="button" 
                    variant="neutral" 
                    className="w-full"
                    disabled={isLoading || isUploadingImages}
                  >
                    لغو
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading || isUploadingImages}
                  disabled={isLoading || isUploadingImages}
                  className="flex-1"
                >
                  {isUploadingImages ? "در حال آپلود..." : isLoading ? "در حال ثبت..." : "ثبت نمونه کار"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
}
