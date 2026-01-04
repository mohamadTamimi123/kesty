"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { User } from "../../types/user";
import { Category } from "../../types/category";
import { Portfolio } from "../../types/portfolio";
import { Review } from "../../types/review";
import { Project } from "../../types/project";

interface SupplierProfileSidebarProps {
  supplier: User & {
    categories?: Category[];
    portfolios?: Portfolio[];
    reviews?: Review[];
  };
  projects: Project[];
  averageRating: string;
  onSendMessage: () => void;
}

export default function SupplierProfileSidebar({
  supplier,
  projects,
  averageRating,
  onSendMessage,
}: SupplierProfileSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Contact */}
      <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
        <h2 className="text-xl font-bold text-brand-dark-blue mb-4">تماس با ما</h2>
        <button
          onClick={onSendMessage}
          className="w-full bg-brand-medium-blue text-white py-3 rounded-lg hover:bg-brand-dark-blue transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          ارسال پیام
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
        <h2 className="text-xl font-bold text-brand-dark-blue mb-4">آمار</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-brand-light-gray last:border-0">
            <span className="text-brand-medium-blue">نمونه کارها:</span>
            <span className="font-bold text-brand-dark-blue text-lg">
              {supplier.portfolios?.length || 0}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-brand-light-gray last:border-0">
            <span className="text-brand-medium-blue">پروژه‌ها:</span>
            <span className="font-bold text-brand-dark-blue text-lg">{projects.length}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-brand-light-gray last:border-0">
            <span className="text-brand-medium-blue">نظرات:</span>
            <span className="font-bold text-brand-dark-blue text-lg">
              {supplier.reviews?.length || 0}
            </span>
          </div>
          {averageRating !== "0" && (
            <div className="flex justify-between items-center py-2 border-b border-brand-light-gray last:border-0">
              <span className="text-brand-medium-blue">امتیاز:</span>
              <span className="font-bold text-brand-dark-blue text-lg">{averageRating}</span>
            </div>
          )}
          {supplier.categories && supplier.categories.length > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-brand-medium-blue">تخصص‌ها:</span>
              <span className="font-bold text-brand-dark-blue text-lg">
                {supplier.categories.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

