"use client";

import { useRouter } from "next/navigation";
import { Message } from "../types/messaging";
import { EyeIcon, CheckCircleIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import Button from "./Button";

interface QuoteMessageCardProps {
  message: Message;
  projectId?: string;
}

export default function QuoteMessageCard({ message, projectId }: QuoteMessageCardProps) {
  const router = useRouter();
  
  // Check if this is a quote message by metadata or content
  const isQuoteByMetadata = message.metadata?.type === 'quote';
  const content = message.content || '';
  const isQuoteByContent = content.includes('پیشنهاد جدید') || 
                           (content.includes('پیشنهاد') && content.includes('قیمت'));

  if (!isQuoteByMetadata && !isQuoteByContent) return null;

  // Extract quote details from metadata (preferred) or content
  const quoteId = message.metadata?.quoteId;
  const metadataProjectId = message.metadata?.projectId;
  const projectTitle = message.metadata?.projectTitle || 
                      content.match(/پروژه:\s*([^\n]+)/)?.[1]?.trim() || 
                      'پروژه';
  const price = message.metadata?.price || 
                content.match(/قیمت:\s*([\d,]+)\s*تومان/)?.[1]?.replace(/,/g, '');
  const deliveryDays = message.metadata?.deliveryTimeDays || 
                      content.match(/زمان تحویل:\s*(\d+)\s*روز/)?.[1];
  const description = message.metadata?.description;
  
  // Use projectId from props, metadata, or message metadata
  const finalProjectId = projectId || metadataProjectId || message.metadata?.projectId;

  const formattedPrice = price ? new Intl.NumberFormat('fa-IR').format(Number(price)) : null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mt-2 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">💼</span>
        </div>
        <div>
          <h3 className="font-bold text-brand-dark-blue text-base">پیشنهاد جدید برای شما</h3>
          <p className="text-xs text-brand-medium-gray">یک پیشنهاد جدید دریافت کردید</p>
        </div>
      </div>

      {/* Quote Info Card */}
      <div className="bg-white rounded-lg p-4 mb-3 border border-green-100">
        {projectTitle && (
          <h4 className="font-semibold text-brand-dark-blue mb-3 text-sm">
            📋 {projectTitle}
          </h4>
        )}
        
        <div className="space-y-2">
          {formattedPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-medium-blue flex items-center gap-1">
                <CurrencyDollarIcon className="w-4 h-4" />
                مبلغ پیشنهادی:
              </span>
              <span className="font-bold text-brand-dark-blue">
                {formattedPrice} تومان
              </span>
            </div>
          )}
          
          {deliveryDays && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-medium-blue">زمان تحویل:</span>
              <span className="font-semibold text-brand-dark-blue">{deliveryDays} روز</span>
            </div>
          )}

          {description && (
            <div className="mt-3 pt-3 border-t border-green-100">
              <p className="text-sm text-brand-medium-blue line-clamp-3">
                {description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {finalProjectId && (
          <Button
            variant="primary"
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => {
              router.push(`/dashboard/customer/projects/${finalProjectId}`);
            }}
          >
            <EyeIcon className="w-4 h-4 ml-2" />
            مشاهده پروژه
          </Button>
        )}
        {finalProjectId && (
          <Button
            variant="neutral"
            size="sm"
            className="w-full border-2 border-green-200 hover:border-green-300"
            onClick={() => {
              router.push(`/dashboard/customer/projects/${finalProjectId}/quotes`);
            }}
          >
            <CheckCircleIcon className="w-4 h-4 ml-2" />
            مشاهده پیشنهادات
          </Button>
        )}
      </div>
    </div>
  );
}
