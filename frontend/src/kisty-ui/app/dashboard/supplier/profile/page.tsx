"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CameraIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  XMarkIcon,
  PlusIcon,
  TagIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  LinkIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { useAuth } from "../../../contexts/AuthContext";
import { validatePhone, validateEmail } from "../../../utils/validation";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import apiClient from "../../../lib/api";
import { getErrorMessage } from "../../../utils/errorHandler";
import { Category } from "../../../types/category";
import { City } from "../../../types/city";

// Helper function to get full image URL
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // If URL is already absolute (starts with http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Get API base URL - use the same logic as apiClient
  let apiBaseUrl: string;
  if (process.env.NEXT_PUBLIC_API_URL) {
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  } else if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // Use same hostname as frontend, but port 3001 for API
    apiBaseUrl = `${protocol}//${hostname}:3001/api`;
  } else {
    apiBaseUrl = 'http://localhost:3001/api';
  }
  
  // Remove trailing /api if exists (we'll add it back)
  const baseUrl = apiBaseUrl.replace(/\/api$/, '');
  
  // If URL starts with /api, use it directly
  if (url.startsWith('/api')) {
    return `${baseUrl}${url}`;
  }
  
  // If URL starts with /uploads, prepend /api
  if (url.startsWith('/uploads')) {
    return `${baseUrl}/api${url}`;
  }
  
  // Otherwise return as is (might be a relative path)
  return url;
};

export default function SupplierProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    workshopName: "",
    workshopAddress: "",
    workshopPhone: "",
    specialties: "",
    experience: "",
    bio: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Categories and Cities management
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showCitySelect, setShowCitySelect] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [publicProfileUrl, setPublicProfileUrl] = useState<string>("");

  // Generate slug from text - supports Persian characters
  const generateSlug = (text: string): string => {
    if (!text || text.trim() === '') {
      return '';
    }
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Compute current profile URL using useMemo
  const currentProfileUrl = useMemo(() => {
    if (publicProfileUrl) {
      return publicProfileUrl;
    }
    const slug = generateSlug(formData.workshopName || formData.name || "");
    if (slug) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      return `${baseUrl}/supplier/${slug}`;
    }
    return '';
  }, [publicProfileUrl, formData.workshopName, formData.name]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await apiClient.getMyProfile();
        setFormData({
          name: profileData.fullName || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
          address: profileData.address || "",
          city: profileData.city || "",
          workshopName: profileData.workshopName || "",
          workshopAddress: profileData.workshopAddress || "",
          workshopPhone: profileData.workshopPhone || "",
          specialties: profileData.metadata?.specialties || "",
          experience: profileData.metadata?.experience || "",
          bio: profileData.bio || "",
        });
        const imageUrl = getImageUrl(profileData.profileImageUrl);
        setProfileImage(imageUrl);
        
        // Generate public profile URL
        const slug = generateSlug(profileData.workshopName || profileData.fullName || "");
        if (slug) {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          setPublicProfileUrl(`${baseUrl}/supplier/${slug}`);
        }
        
        // Fetch supplier categories and cities
        if (user?.id) {
          try {
            const [categories, cities] = await Promise.all([
              apiClient.getSupplierCategories(user.id),
              apiClient.getSupplierCities(user.id),
            ]);
            setSelectedCategories(categories || []);
            setSelectedCities(cities || []);
          } catch (error) {
            logger.error("Error fetching supplier categories/cities", error);
          }
        }
      } catch (error: unknown) {
        logger.error("Error fetching profile", error);
        // Fallback to user from context
        if (user) {
          const fallbackFormData = {
            name: user.name || "",
            phone: user.phone || "",
            email: user.email || "",
            address: "",
            city: "",
            workshopName: "",
            workshopAddress: "",
            workshopPhone: "",
            specialties: "",
            experience: "",
            bio: "",
          };
          setFormData(fallbackFormData);
          const fallbackImageUrl = getImageUrl((user as any).profileImageUrl);
          setProfileImage(fallbackImageUrl);
          
          // Generate public profile URL from fallback data
          const slug = generateSlug(fallbackFormData.workshopName || fallbackFormData.name || "");
          if (slug) {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            setPublicProfileUrl(`${baseUrl}/supplier/${slug}`);
          }
        }
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Fetch available categories and cities
  useEffect(() => {
    const fetchAvailableData = async () => {
      try {
        const [categoriesData, categoryTreeData, citiesData] = await Promise.all([
          apiClient.getActiveCategories(),
          apiClient.getCategoryTree().catch(() => []), // Fallback to empty array if tree endpoint fails
          apiClient.getActiveCities(),
        ]);
        setAvailableCategories(categoriesData || []);
        setCategoryTree(Array.isArray(categoryTreeData) ? categoryTreeData : []);
        setAvailableCities(citiesData || []);
      } catch (error) {
        logger.error("Error fetching available categories/cities", error);
      }
    };
    fetchAvailableData();
  }, []);

  const handleChange = (field: string, value: string) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    
    // Update public profile URL if workshopName or name changes
    if (field === 'workshopName' || field === 'name') {
      const slug = generateSlug(updatedFormData.workshopName || updatedFormData.name || "");
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      // Always update publicProfileUrl, even if slug is empty (will be handled by useMemo)
      setPublicProfileUrl(slug ? `${baseUrl}/supplier/${slug}` : "");
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    
    setSuccessMessage("");
  };

  // Helper function to find category in tree (recursive)
  const findCategoryInTree = (categories: Category[], id: string): Category | null => {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategoryInTree(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to get all categories (including children) from tree
  const getAllCategoriesFromTree = (categories: Category[]): Category[] => {
    const result: Category[] = [];
    const traverse = (cats: Category[]) => {
      for (const cat of cats) {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children);
        }
      }
    };
    traverse(categories);
    return result;
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddCategory = async (categoryId: string) => {
    if (!user?.id) return;
    
    // Check if already added
    if (selectedCategories.some(cat => cat.id === categoryId)) {
      toast.error("این دسته‌بندی قبلاً اضافه شده است");
      return;
    }

    try {
      setIsLoadingCategories(true);
      await apiClient.addCategoryToSupplier(categoryId, user.id);
      
      // Find category from tree or flat list
      const category = findCategoryInTree(categoryTree, categoryId) || 
                       availableCategories.find(cat => cat.id === categoryId);
      
      if (category) {
        setSelectedCategories([...selectedCategories, category]);
        toast.success("دسته‌بندی با موفقیت اضافه شد");
      }
      // Don't close modal automatically - let user add more categories
    } catch (error: unknown) {
      logger.error("Error adding category", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!user?.id) return;

    try {
      setIsLoadingCategories(true);
      await apiClient.removeCategoryFromSupplier(categoryId, user.id);
      setSelectedCategories(selectedCategories.filter(cat => cat.id !== categoryId));
      toast.success("دسته‌بندی با موفقیت حذف شد");
    } catch (error: unknown) {
      logger.error("Error removing category", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleAddCity = async (cityId: string) => {
    if (!user?.id) return;
    
    // Check if already added
    if (selectedCities.some(city => city.id === cityId)) {
      toast.error("این شهر قبلاً اضافه شده است");
      return;
    }

    try {
      setIsLoadingCities(true);
      await apiClient.addCityToSupplier(cityId, user.id);
      const city = availableCities.find(c => c.id === cityId);
      if (city) {
        setSelectedCities([...selectedCities, city]);
        toast.success("شهر با موفقیت اضافه شد");
      }
      setShowCitySelect(false);
    } catch (error: unknown) {
      logger.error("Error adding city", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleRemoveCity = async (cityId: string) => {
    if (!user?.id) return;

    try {
      setIsLoadingCities(true);
      await apiClient.removeCityFromSupplier(cityId, user.id);
      setSelectedCities(selectedCities.filter(city => city.id !== cityId));
      toast.success("شهر با موفقیت حذف شد");
    } catch (error: unknown) {
      logger.error("Error removing city", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل‌های تصویری مجاز است");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم فایل باید کمتر از 2MB باشد");
      return;
    }

    setIsUploadingImage(true);

    try {
      const result = await apiClient.uploadProfileImage(file);
      const fullImageUrl = getImageUrl(result.imageUrl);
      setProfileImage(fullImageUrl);
      toast.success("تصویر پروفایل با موفقیت آپلود شد");
    } catch (error: unknown) {
      logger.error("Error uploading profile image", error);
      const errorMessage =
        (error as any)?.response?.data?.message || "خطا در آپلود تصویر";
      toast.error(errorMessage);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate fullName (required, min 2 chars, max 100)
    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed) {
      newErrors.name = "نام الزامی است";
    } else if (nameTrimmed.length < 2) {
      newErrors.name = "نام باید حداقل 2 کاراکتر باشد";
    } else if (nameTrimmed.length > 100) {
      newErrors.name = "نام نمی‌تواند بیشتر از 100 کاراکتر باشد";
    }

    // Validate workshopName (required, max 255)
    const workshopNameTrimmed = formData.workshopName.trim();
    if (!workshopNameTrimmed) {
      newErrors.workshopName = "نام کارگاه الزامی است";
    } else if (workshopNameTrimmed.length > 255) {
      newErrors.workshopName = "نام کارگاه نمی‌تواند بیشتر از 255 کاراکتر باشد";
    }

    // Validate phone (max 11 chars, must be valid if provided)
    if (formData.phone) {
      const phoneTrimmed = formData.phone.trim();
      if (phoneTrimmed.length > 11) {
        newErrors.phone = "شماره موبایل نمی‌تواند بیشتر از 11 کاراکتر باشد";
      } else {
        const phoneError = validatePhone(phoneTrimmed);
        if (phoneError) newErrors.phone = phoneError;
      }
    }

    // Validate email (must be valid if provided)
    if (formData.email) {
      const emailTrimmed = formData.email.trim();
      if (emailTrimmed) {
        const emailError = validateEmail(emailTrimmed);
        if (emailError) newErrors.email = emailError;
      }
    }

    // Validate workshopPhone (max 20 chars)
    if (formData.workshopPhone) {
      const workshopPhoneTrimmed = formData.workshopPhone.trim();
      if (workshopPhoneTrimmed.length > 20) {
        newErrors.workshopPhone = "شماره تماس کارگاه نمی‌تواند بیشتر از 20 کاراکتر باشد";
      } else if (workshopPhoneTrimmed) {
        const phoneError = validatePhone(workshopPhoneTrimmed);
        if (phoneError) newErrors.workshopPhone = phoneError;
      }
    }

    // Validate city (max 100 chars)
    if (formData.city && formData.city.trim().length > 100) {
      newErrors.city = "نام شهر نمی‌تواند بیشتر از 100 کاراکتر باشد";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare profile data - only send fields with actual values (not empty strings)
      // Backend expects optional fields to be undefined if not provided, not empty strings
      const profileData: {
        fullName: string;
        workshopName: string;
        phone?: string;
        email?: string;
        workshopAddress?: string;
        workshopPhone?: string;
        address?: string;
        city?: string;
        bio?: string;
        specialties?: string;
        experience?: string;
      } = {
        fullName: formData.name.trim(),
        workshopName: formData.workshopName.trim(),
      };
      
      // Add optional fields only if they have non-empty values
      const phoneTrimmed = formData.phone.trim();
      if (phoneTrimmed) profileData.phone = phoneTrimmed;
      
      const emailTrimmed = formData.email.trim();
      if (emailTrimmed) profileData.email = emailTrimmed;
      
      const workshopAddressTrimmed = formData.workshopAddress.trim();
      if (workshopAddressTrimmed) profileData.workshopAddress = workshopAddressTrimmed;
      
      const workshopPhoneTrimmed = formData.workshopPhone.trim();
      if (workshopPhoneTrimmed) profileData.workshopPhone = workshopPhoneTrimmed;
      
      const addressTrimmed = formData.address.trim();
      if (addressTrimmed) profileData.address = addressTrimmed;
      
      const cityTrimmed = formData.city.trim();
      if (cityTrimmed) profileData.city = cityTrimmed;
      
      const bioTrimmed = formData.bio.trim();
      if (bioTrimmed) profileData.bio = bioTrimmed;
      
      const specialtiesTrimmed = formData.specialties.trim();
      if (specialtiesTrimmed) profileData.specialties = specialtiesTrimmed;
      
      const experienceTrimmed = formData.experience.trim();
      if (experienceTrimmed) profileData.experience = experienceTrimmed;

      logger.info("Updating profile with data", profileData);
      const updatedProfile = await apiClient.updateMyProfile(profileData);

      // Update user in context
      updateUser({
        name: updatedProfile.fullName,
        phone: updatedProfile.phone,
        email: updatedProfile.email,
      });

      setSuccessMessage("اطلاعات با موفقیت به‌روزرسانی شد");
      toast.success("پروفایل کارگاه با موفقیت به‌روزرسانی شد");
      
      // Update public profile URL if workshopName or name changed
      const slug = generateSlug(formData.workshopName || formData.name || "");
      if (slug) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        setPublicProfileUrl(`${baseUrl}/supplier/${slug}`);
      }
      
      // Scroll to top to show success message and public profile section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: unknown) {
      logger.error("Error updating profile", error);
      
      // Extract detailed error message from backend
      let errorMessage = "خطا در به‌روزرسانی پروفایل";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
        
        // Log full error details for debugging
        logger.error("Full error response", {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: errorMessage,
        });
      } else {
        errorMessage = getErrorMessage(error);
      }
      
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            پروفایل کارگاه
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات کارگاه و تخصص‌های خود را تکمیل کنید
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 animate-fade-in">
            {successMessage}
          </div>
        )}

        {/* Public Profile Link - Always show if we have workshopName or name */}
        {(currentProfileUrl || formData.workshopName || formData.name) && (
          <div className="bg-gradient-to-r from-brand-medium-blue to-brand-dark-blue rounded-lg shadow-md p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 font-display">
                  پروفایل عمومی شما
                </h3>
                <p className="text-sm text-white/90 mb-3">
                  لینک پروفایل عمومی کارگاه شما برای به‌اشتراک‌گذاری
                </p>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mb-3">
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-sm font-mono break-all">
                    {currentProfileUrl || 'لطفا نام کارگاه را وارد کنید'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        if (!currentProfileUrl) {
                          toast.error("لطفا ابتدا نام کارگاه را وارد کنید");
                          return;
                        }
                        
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(currentProfileUrl);
                          toast.success("لینک کپی شد");
                        } else {
                          // Fallback for older browsers
                          const textArea = document.createElement("textarea");
                          textArea.value = currentProfileUrl;
                          textArea.style.position = "fixed";
                          textArea.style.left = "-999999px";
                          textArea.style.top = "-999999px";
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          const successful = document.execCommand("copy");
                          document.body.removeChild(textArea);
                          if (successful) {
                            toast.success("لینک کپی شد");
                          } else {
                            toast.error("خطا در کپی کردن لینک");
                          }
                        }
                      } catch (error) {
                        logger.error("Error copying link", error);
                        toast.error("خطا در کپی کردن لینک");
                      }
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    کپی لینک
                  </button>
                  <a
                    href={currentProfileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white text-brand-medium-blue hover:bg-white/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <ShareIcon className="w-4 h-4" />
                    مشاهده پروفایل
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
          {/* Profile Picture Section */}
          <div className="mb-8 pb-8 border-b border-brand-medium-gray">
            <div className="flex items-center gap-6">
              <div className="relative">
                {profileImage ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-medium-gray">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-light-sky flex items-center justify-center border-2 border-brand-medium-gray">
                    <BuildingOfficeIcon className="w-12 h-12 text-brand-medium-blue" />
                  </div>
                )}
                <label
                  className={`absolute bottom-0 right-0 w-8 h-8 bg-brand-medium-blue text-white rounded-full flex items-center justify-center hover:bg-brand-dark-blue transition-colors shadow-md cursor-pointer ${
                    isUploadingImage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <CameraIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
                {isUploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-dark-blue mb-1">
                  تصویر کارگاه
                </h3>
                <p className="text-sm text-brand-medium-blue mb-3">
                  فرمت‌های مجاز: JPG, PNG (حداکثر 2MB)
                </p>
                <label className="cursor-pointer">
                  <span className="inline-block">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? "در حال آپلود..." : "تغییر تصویر"}
                    </Button>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
                اطلاعات شخصی
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="text"
                  name="name"
                  label="نام و نام خانوادگی"
                  placeholder="نام خود را وارد کنید"
                  icon={<UserIcon className="w-5 h-5" />}
                  iconPosition="start"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  required
                />

                <Input
                  type="tel"
                  name="phone"
                  label="شماره موبایل"
                  placeholder="09123456789"
                  icon={<DevicePhoneMobileIcon className="w-5 h-5" />}
                  iconPosition="start"
                  value={formData.phone}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                  error={errors.phone}
                  required
                />

                <Input
                  type="email"
                  name="email"
                  label="ایمیل"
                  placeholder="example@email.com"
                  icon={<EnvelopeIcon className="w-5 h-5" />}
                  iconPosition="start"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  validation={validateEmail}
                  error={errors.email}
                />

                <Input
                  type="text"
                  name="city"
                  label="شهر محل سکونت"
                  placeholder="شهر محل سکونت (اختیاری)"
                  icon={<MapPinIcon className="w-5 h-5" />}
                  iconPosition="start"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  helperText="این فیلد برای شهر محل سکونت شخصی است و با شهرهای کاری متفاوت است"
                />
              </div>
            </div>

            {/* Workshop Information Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
                اطلاعات کارگاه
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="text"
                  name="workshopName"
                  label="نام کارگاه"
                  placeholder="نام کارگاه خود را وارد کنید"
                  icon={<BuildingOfficeIcon className="w-5 h-5" />}
                  iconPosition="start"
                  value={formData.workshopName}
                  onChange={(e) => handleChange("workshopName", e.target.value)}
                  error={errors.workshopName}
                  required
                />

                <Input
                  type="text"
                  name="experience"
                  label="سال‌های تجربه"
                  placeholder="مثال: 10"
                  icon={<BriefcaseIcon className="w-5 h-5" />}
                  iconPosition="start"
                  value={formData.experience}
                  onChange={(e) => handleChange("experience", e.target.value)}
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  آدرس کارگاه
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg bg-white text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue transition-colors"
                  placeholder="آدرس کامل کارگاه خود را وارد کنید"
                  value={formData.workshopAddress}
                  onChange={(e) => handleChange("workshopAddress", e.target.value)}
                />
              </div>

              <div className="mt-6">
                <Input
                  type="tel"
                  name="workshopPhone"
                  label="شماره تماس کارگاه"
                  placeholder="09123456789"
                  icon={<DevicePhoneMobileIcon className="w-5 h-5" />}
                  iconPosition="start"
                  value={formData.workshopPhone}
                  onChange={(e) => handleChange("workshopPhone", e.target.value)}
                  validation={validatePhone}
                  error={errors.workshopPhone}
                  helperText="شماره تماس کارگاه برای نمایش در پروفایل عمومی"
                />
              </div>
            </div>

            {/* Categories Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
                دسته‌بندی‌های کاری
              </h2>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-brand-dark-blue">
                    دسته‌بندی‌های انتخاب شده
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCategoryDrawer(true)}
                    disabled={isLoadingCategories}
                  >
                    <PlusIcon className="w-4 h-4 ml-1" />
                    افزودن دسته‌بندی
                  </Button>
                </div>
                {selectedCategories.length === 0 ? (
                  <div className="p-4 border border-brand-medium-gray rounded-lg bg-brand-off-white text-center text-brand-medium-blue">
                    <TagIcon className="w-8 h-8 mx-auto mb-2 text-brand-medium-gray" />
                    <p className="text-sm">هنوز دسته‌بندی‌ای انتخاب نشده است</p>
                    <p className="text-xs mt-1">برای دریافت درخواست‌های مرتبط، دسته‌بندی‌های کاری خود را انتخاب کنید</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-2 px-3 py-2 bg-brand-light-sky border border-brand-medium-gray rounded-lg"
                      >
                        <span className="text-sm text-brand-dark-blue">{category.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          disabled={isLoadingCategories}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cities Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
                شهرهای کاری
              </h2>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-brand-dark-blue">
                    شهرهای انتخاب شده
                  </label>
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        const selectedCityId = e.target.value;
                        if (selectedCityId) {
                          handleAddCity(selectedCityId);
                          // Reset select value
                          (e.target as HTMLSelectElement).value = "";
                        }
                      }}
                      className="px-4 py-2 border border-brand-medium-gray rounded-lg text-sm text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue bg-white min-w-[200px]"
                      disabled={isLoadingCities || availableCities.length === 0}
                    >
                      <option value="">افزودن شهر...</option>
                      {availableCities
                        .filter(city => !selectedCities.some(sc => sc.id === city.id))
                        .map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.title}
                          </option>
                        ))}
                    </select>
                    {availableCities.length === 0 && (
                      <p className="text-xs text-brand-medium-blue mt-1">
                        در حال بارگذاری شهرها...
                      </p>
                    )}
                  </div>
                </div>
                {selectedCities.length === 0 ? (
                  <div className="p-4 border border-brand-medium-gray rounded-lg bg-brand-off-white text-center text-brand-medium-blue">
                    <MapPinIcon className="w-8 h-8 mx-auto mb-2 text-brand-medium-gray" />
                    <p className="text-sm">هنوز شهری انتخاب نشده است</p>
                    <p className="text-xs mt-1">شهرهای کاری خود را انتخاب کنید تا درخواست‌های مرتبط دریافت کنید</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCities.map((city) => (
                      <div
                        key={city.id}
                        className="flex items-center gap-2 px-3 py-2 bg-brand-light-sky border border-brand-medium-gray rounded-lg"
                      >
                        <span className="text-sm text-brand-dark-blue">{city.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCity(city.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          disabled={isLoadingCities}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Specialties Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-brand-dark-blue mb-4 pb-2 border-b border-brand-medium-gray">
                تخصص‌ها
              </h2>
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  تخصص‌های کارگاه
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg bg-white text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue transition-colors"
                  placeholder="تخصص‌های خود را وارد کنید (مثال: فلزکاری، چوب‌کاری، ساخت و ساز)"
                  value={formData.specialties}
                  onChange={(e) => handleChange("specialties", e.target.value)}
                />
                <p className="text-xs text-brand-medium-blue mt-2">
                  تخصص‌های خود را با کاما جدا کنید
                </p>
              </div>
            </div>

            {/* Bio Section */}
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                درباره کارگاه
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg bg-white text-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue transition-colors"
                placeholder="توضیحات درباره کارگاه و خدمات ارائه شده..."
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
              />
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {errors.submit}
              </div>
            )}

            <div className="flex gap-4 pt-4">
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
              >
                انصراف
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Selection Modal */}
      {showCategoryDrawer && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategoryDrawer(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-scale-in z-[101]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-medium-gray">
              <h2 className="text-xl font-bold text-brand-dark-blue">انتخاب دسته‌بندی</h2>
              <button
                onClick={() => setShowCategoryDrawer(false)}
                className="p-2 rounded-lg hover:bg-brand-light-gray transition-colors text-brand-medium-blue hover:text-brand-dark-blue"
                aria-label="بستن"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingCategories ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue mx-auto mb-3"></div>
                  <p className="text-brand-medium-blue">در حال بارگذاری...</p>
                </div>
              ) : categoryTree.length === 0 && availableCategories.filter(cat => !cat.parentId).length === 0 ? (
                <div className="text-center py-8">
                  <TagIcon className="w-12 h-12 mx-auto mb-3 text-brand-medium-gray" />
                  <p className="text-brand-medium-blue">دسته‌بندی‌ای یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {(categoryTree.length > 0 ? categoryTree : availableCategories.filter(cat => !cat.parentId))
                    .map((category) => {
                      const isSelected = selectedCategories.some(cat => cat.id === category.id);
                      const hasChildren = category.children && category.children.length > 0;
                      const isExpanded = expandedCategories.has(category.id);
                      
                      return (
                        <div key={category.id}>
                          <div className="flex items-center gap-2">
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={() => toggleCategoryExpansion(category.id)}
                                className="p-1 hover:bg-brand-light-gray rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="w-4 h-4 text-brand-medium-blue" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4 text-brand-medium-blue" />
                                )}
                              </button>
                            )}
                            {!hasChildren && <div className="w-6" />}
                            <button
                              type="button"
                              onClick={() => {
                                if (!isSelected && !isLoadingCategories) {
                                  handleAddCategory(category.id);
                                }
                              }}
                              disabled={isSelected || isLoadingCategories}
                              className={`flex-1 text-right p-3 rounded-lg border transition-all ${
                                isSelected
                                  ? "bg-green-50 border-green-300 text-green-800 cursor-not-allowed"
                                  : isLoadingCategories
                                  ? "bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-white border-brand-medium-gray hover:bg-brand-light-sky hover:border-brand-medium-blue text-brand-dark-blue cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{category.title}</span>
                                {isSelected && (
                                  <span className="text-sm font-semibold">✓ انتخاب شده</span>
                                )}
                              </div>
                              {category.description && (
                                <p className="text-xs mt-1 text-brand-medium-blue text-right">
                                  {category.description}
                                </p>
                              )}
                            </button>
                          </div>
                          
                          {/* Children (Subcategories) */}
                          {hasChildren && isExpanded && (
                            <div className="mr-8 mt-1 space-y-1">
                              {category.children!.map((child) => {
                                const isChildSelected = selectedCategories.some(cat => cat.id === child.id);
                                return (
                                  <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => {
                                      if (!isChildSelected && !isLoadingCategories) {
                                        handleAddCategory(child.id);
                                      }
                                    }}
                                    disabled={isChildSelected || isLoadingCategories}
                                    className={`w-full text-right p-3 rounded-lg border transition-all ${
                                      isChildSelected
                                        ? "bg-green-50 border-green-300 text-green-800 cursor-not-allowed"
                                        : isLoadingCategories
                                        ? "bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-brand-off-white border-brand-medium-gray hover:bg-brand-light-sky hover:border-brand-medium-blue text-brand-dark-blue cursor-pointer"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">{child.title}</span>
                                      {isChildSelected && (
                                        <span className="text-xs font-semibold">✓ انتخاب شده</span>
                                      )}
                                    </div>
                                    {child.description && (
                                      <p className="text-xs mt-1 text-brand-medium-blue text-right">
                                        {child.description}
                                      </p>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-brand-medium-gray">
              <Button
                variant="primary"
                onClick={() => setShowCategoryDrawer(false)}
                className="w-full"
                disabled={isLoadingCategories}
              >
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

