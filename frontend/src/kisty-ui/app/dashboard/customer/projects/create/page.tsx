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
import logger from "../../../../utils/logger";
import { getErrorMessage } from "../../../../utils/errorHandler";
import Breadcrumb from "../../../../components/Breadcrumb";

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
      const createdProject = await apiClient.createProject({
        ...data,
        quantityEstimate: data.quantityEstimate,
      });
      
      toast.success("پروژه با موفقیت ثبت شد");
      
      // Set refresh flag
      localStorage.setItem("refreshProjects", Date.now().toString());
      
      // Check suppliers in background (non-blocking)
      apiClient.getRelevantSuppliers(createdProject.id)
        .then((relevantSuppliers) => {
          if (relevantSuppliers.suppliers && relevantSuppliers.suppliers.length > 0) {
            toast.success(
              `پروژه به ${relevantSuppliers.count} تولیدکننده مرتبط ارسال شد`,
              { duration: 4000 }
            );
          }
        })
        .catch((distError) => {
          logger.error("Error checking project distribution", distError);
          // Silent fail - don't show error to user
        });
      
      // Reset loading state before redirect to prevent stuck loading
      setIsLoading(false);
      
      // Use setTimeout to ensure state update is processed before redirect
      setTimeout(() => {
        router.push(`/dashboard/customer/projects/${createdProject.id}`);
      }, 100);
    } catch (error: unknown) {
      logger.error("Error creating project", error);
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "خطا در ثبت پروژه. لطفاً دوباره تلاش کنید.");
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "داشبورد", href: "/dashboard/customer" },
              { label: "پروژه‌ها", href: "/dashboard/customer/projects" },
              { label: "ثبت پروژه جدید" },
            ]}
          />
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

