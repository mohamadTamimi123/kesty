"use client";

import { useState, useEffect } from "react";
import { DocumentTextIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Button from "./Button";
import Input from "./Input";
import { CreateProjectData, QuantityEstimate } from "../types/project";
import { City } from "../types/city";
import { Category } from "../types/category";
import { Machine } from "../types/machine";
import apiClient from "../lib/api";
import logger from "../utils/logger";
import { getErrorMessage } from "../utils/errorHandler";
import LoadingSpinner from "./LoadingSpinner";

interface ProjectFormProps {
  onSubmit: (data: CreateProjectData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CreateProjectData>;
}

export default function ProjectForm({ onSubmit, isLoading = false, initialData }: ProjectFormProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    cityId: initialData?.cityId || "",
    categoryId: initialData?.categoryId || "",
    subCategoryId: initialData?.subCategoryId,
    machineId: initialData?.machineId,
    quantityEstimate: initialData?.quantityEstimate,
    isPublic: initialData?.isPublic !== undefined ? initialData.isPublic : true,
    files: [],
  });
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [filePreviews, setFilePreviews] = useState<{ file: File; preview: string }[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProjectData, string>>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesData, categoriesData] = await Promise.all([
          apiClient.getActiveCities(),
          apiClient.getActiveCategories(),
        ]);
        setCities(citiesData);
        // Only show main categories (without parentId) in the main category select
        setCategories(categoriesData.filter((cat: Category) => !cat.parentId));
      } catch (error: unknown) {
        logger.error("Error fetching data", error);
        // Silently fail - form can still be used
      }
    };
    fetchData();
  }, []);

  // Load subcategories when category is selected
  useEffect(() => {
    if (formData.categoryId) {
      setIsLoadingSubCategories(true);
      const fetchSubCategories = async () => {
        try {
          const allCategories = await apiClient.getActiveCategories();
          // Filter subcategories that have the selected category as parent
          const subs = allCategories.filter(
            (cat: Category) => cat.parentId === formData.categoryId
          );
          setSubCategories(subs);
          // Reset subCategoryId if it's not in the new list
          if (formData.subCategoryId && !subs.find((cat: Category) => cat.id === formData.subCategoryId)) {
            setFormData((prev) => ({ ...prev, subCategoryId: undefined }));
          }
        } catch (error: unknown) {
          logger.error("Error fetching subcategories", error);
        } finally {
          setIsLoadingSubCategories(false);
        }
      };
      fetchSubCategories();
    } else {
      setSubCategories([]);
      setFormData((prev) => ({ ...prev, subCategoryId: undefined }));
    }
  }, [formData.categoryId]);

  // Load machines when category is selected
  useEffect(() => {
    if (formData.categoryId) {
      setIsLoadingMachines(true);
      const fetchMachines = async () => {
        try {
          const machinesData = await apiClient.getMachines(formData.categoryId);
          setMachines(machinesData);
          // Reset machineId if it's not in the new list
          if (formData.machineId && !machinesData.find((m: Machine) => m.id === formData.machineId)) {
            setFormData((prev) => ({ ...prev, machineId: undefined }));
          }
        } catch (error: unknown) {
          logger.error("Error fetching machines", error);
        } finally {
          setIsLoadingMachines(false);
        }
      };
      fetchMachines();
    } else {
      setMachines([]);
      setFormData((prev) => ({ ...prev, machineId: undefined }));
    }
  }, [formData.categoryId]);

  const handleChange = (field: keyof CreateProjectData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // Reset dependent fields when category changes
      if (field === "categoryId") {
        newData.subCategoryId = undefined;
        newData.machineId = undefined;
      }
      return newData;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: { file: File; preview: string }[] = [];

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`فایل ${file.name} بزرگتر از 10 مگابایت است`);
        return;
      }
      newFiles.push(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({ file, preview: reader.result as string });
          setFilePreviews((prev) => [...prev, ...newPreviews]);
        };
        reader.readAsDataURL(file);
      } else {
        newPreviews.push({ file, preview: '' });
      }
    });

    setFormData((prev) => ({
      ...prev,
      files: [...(prev.files || []), ...newFiles],
    }));
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files?.filter((_, i) => i !== index) || [],
    }));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateProjectData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان الزامی است";
    } else if (formData.title.length < 3) {
      newErrors.title = "عنوان باید حداقل 3 کاراکتر باشد";
    }

    if (!formData.description.trim()) {
      newErrors.description = "توضیحات الزامی است";
    } else if (formData.description.length < 10) {
      newErrors.description = "توضیحات باید حداقل 10 کاراکتر باشد";
    }

    if (!formData.cityId) {
      newErrors.cityId = "انتخاب شهر الزامی است";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "انتخاب دسته‌بندی الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        type="text"
        id="title"
        name="title"
        label="عنوان پروژه"
        placeholder="مثال: ساخت 100 عدد پایه فلزی"
        icon={<DocumentTextIcon className="w-5 h-5" />}
        iconPosition="start"
        value={formData.title}
        onChange={(e) => handleChange("title", e.target.value)}
        error={errors.title}
        required
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
          rows={6}
          placeholder="جزئیات پروژه را شرح دهید..."
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue resize-none ${
            errors.description ? 'border-red-500' : 'border-brand-medium-gray'
          }`}
          required
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cityId"
            className="block text-sm font-medium mb-2 text-brand-dark-blue"
          >
            شهر مورد نظر
          </label>
          <select
            id="cityId"
            name="cityId"
            value={formData.cityId}
            onChange={(e) => handleChange("cityId", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue ${
              errors.cityId ? 'border-red-500' : 'border-brand-medium-gray'
            }`}
            required
          >
            <option value="">انتخاب شهر</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.title}
              </option>
            ))}
          </select>
          {errors.cityId && (
            <p className="mt-1 text-sm text-red-600">{errors.cityId}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium mb-2 text-brand-dark-blue"
          >
            دسته‌بندی
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={(e) => handleChange("categoryId", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue ${
              errors.categoryId ? 'border-red-500' : 'border-brand-medium-gray'
            }`}
            required
          >
            <option value="">انتخاب دسته‌بندی</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
          )}
        </div>
      </div>

      {/* Subcategory and Machine Selection */}
      {(subCategories.length > 0 || machines.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subCategories.length > 0 && (
            <div>
              <label
                htmlFor="subCategoryId"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                زیردسته‌بندی (اختیاری)
              </label>
              <select
                id="subCategoryId"
                name="subCategoryId"
                value={formData.subCategoryId || ""}
                onChange={(e) => handleChange("subCategoryId", e.target.value || undefined)}
                disabled={isLoadingSubCategories}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue ${
                  isLoadingSubCategories ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                } border-brand-medium-gray`}
              >
                <option value="">انتخاب زیردسته‌بندی</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.title}
                  </option>
                ))}
              </select>
              {isLoadingSubCategories && (
                <p className="mt-1 text-xs text-brand-medium-blue">در حال بارگذاری...</p>
              )}
            </div>
          )}

          {machines.length > 0 && (
            <div>
              <label
                htmlFor="machineId"
                className="block text-sm font-medium mb-2 text-brand-dark-blue"
              >
                ماشین‌آلات (اختیاری)
              </label>
              <select
                id="machineId"
                name="machineId"
                value={formData.machineId || ""}
                onChange={(e) => handleChange("machineId", e.target.value || undefined)}
                disabled={isLoadingMachines}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue ${
                  isLoadingMachines ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                } border-brand-medium-gray`}
              >
                <option value="">انتخاب ماشین</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
              {isLoadingMachines && (
                <p className="mt-1 text-xs text-brand-medium-blue">در حال بارگذاری...</p>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <label
          htmlFor="quantityEstimate"
          className="block text-sm font-medium mb-2 text-brand-dark-blue"
        >
          تخمین تعداد
        </label>
        <select
          id="quantityEstimate"
          name="quantityEstimate"
          value={formData.quantityEstimate || ""}
          onChange={(e) => handleChange("quantityEstimate", e.target.value as QuantityEstimate)}
          className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue text-brand-dark-blue"
        >
          <option value="">انتخاب کنید</option>
          <option value={QuantityEstimate.LESS_THAN_10}>کمتر از 10 عدد</option>
          <option value={QuantityEstimate.BETWEEN_10_100}>10 تا 100 عدد</option>
          <option value={QuantityEstimate.MORE_THAN_100}>بیشتر از 100 عدد</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="files"
          className="block text-sm font-medium mb-2 text-brand-dark-blue"
        >
          آپلود فایل (اختیاری)
        </label>
        <div className="space-y-3">
          {filePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filePreviews.map((item, index) => (
                <div key={index} className="relative">
                  {item.preview ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-brand-medium-gray">
                      <img
                        src={item.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-lg border border-brand-medium-gray flex items-center justify-center bg-brand-light-gray">
                      <DocumentTextIcon className="w-8 h-8 text-brand-medium-blue" />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-brand-medium-blue mt-1 truncate">
                    {item.file.name}
                  </p>
                </div>
              ))}
            </div>
          )}
          <label
            htmlFor="files"
            className="flex items-center gap-2 px-4 py-2 border border-brand-medium-gray rounded-lg cursor-pointer hover:bg-brand-light-gray transition-colors w-fit"
          >
            <PhotoIcon className="w-5 h-5 text-brand-medium-blue" />
            <span className="text-sm text-brand-dark-blue">افزودن فایل</span>
          </label>
          <input
            type="file"
            id="files"
            name="files"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-xs text-brand-medium-blue">
            فرمت‌های مجاز: تصاویر، PDF، Word، Excel | حداکثر حجم: 10 مگابایت
          </p>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) => handleChange("isPublic", e.target.checked)}
            className="w-4 h-4 text-brand-medium-blue border-brand-medium-gray rounded focus:ring-brand-medium-blue"
          />
          <span className="text-sm text-brand-dark-blue">
            این پروژه به صورت عمومی نمایش داده شود
          </span>
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
      >
        ثبت درخواست پروژه
      </Button>
    </form>
  );
}

