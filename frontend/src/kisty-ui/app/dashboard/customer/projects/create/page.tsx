"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../components/MobileLayout";
import ProjectForm from "../../../../components/ProjectForm";
import { CreateProjectData } from "../../../../types/project";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";

export default function CreateProjectPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (data: CreateProjectData) => {
    try {
      setIsLoading(true);
      await apiClient.createProject({
        ...data,
        quantityEstimate: data.quantityEstimate,
      });
      toast.success("پروژه با موفقیت ثبت شد");
      router.push("/dashboard/customer/projects");
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.response?.data?.message || "خطا در ثبت پروژه");
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/customer/projects"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowRightIcon className="w-4 h-4 ml-1" />
            بازگشت به لیست پروژه‌ها
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
            ثبت درخواست پروژه
          </h1>
          <p className="text-brand-medium-blue">
            اطلاعات پروژه خود را وارد کنید
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <ProjectForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </MobileLayout>
  );
}

