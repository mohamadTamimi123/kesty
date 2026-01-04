"use client";

import { useRouter } from "next/navigation";
import { Message } from "../types/messaging";
import { EyeIcon, DocumentTextIcon, MapPinIcon, TagIcon } from "@heroicons/react/24/outline";
import Button from "./Button";

interface ProjectMessageCardProps {
  message: Message;
}

export default function ProjectMessageCard({ message }: ProjectMessageCardProps) {
  const router = useRouter();
  const projectId = message.metadata?.projectId;
  
  // Get project details from metadata (preferred) or parse from content
  const projectTitle = message.metadata?.projectTitle || 'پروژه';
  const projectDescription = message.metadata?.projectDescription || '';
  const category = message.metadata?.categoryTitle || '';
  const city = message.metadata?.cityTitle || '';

  if (!projectId) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mt-2 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">🎯</span>
        </div>
        <div>
          <h3 className="font-bold text-brand-dark-blue text-base">پروژه جدید برای شما</h3>
          <p className="text-xs text-brand-medium-gray">این پروژه با مشخصات شما همخوانی دارد</p>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="bg-white rounded-lg p-4 mb-3 border border-blue-100">
        <h4 className="font-semibold text-brand-dark-blue mb-2 text-sm">
          📋 {projectTitle}
        </h4>
        
        {projectDescription && (
          <p className="text-sm text-brand-medium-blue mb-3 line-clamp-3">
            {projectDescription.length > 200 
              ? projectDescription.substring(0, 200) + '...' 
              : projectDescription}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-xs">
          {category && (
            <div className="flex items-center gap-1 text-brand-medium-blue">
              <TagIcon className="w-4 h-4" />
              <span>{category}</span>
            </div>
          )}
          {city && (
            <div className="flex items-center gap-1 text-brand-medium-blue">
              <MapPinIcon className="w-4 h-4" />
              <span>{city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => {
            router.push(`/dashboard/supplier/projects/${projectId}`);
          }}
        >
          <EyeIcon className="w-4 h-4 ml-2" />
          مشاهده پروژه
        </Button>
        <Button
          variant="neutral"
          size="sm"
          className="w-full border-2 border-blue-200 hover:border-blue-300"
          onClick={() => {
            router.push(`/dashboard/supplier/projects/${projectId}/quote`);
          }}
        >
          <DocumentTextIcon className="w-4 h-4 ml-2" />
          ارسال پیشنهاد
        </Button>
      </div>
    </div>
  );
}
