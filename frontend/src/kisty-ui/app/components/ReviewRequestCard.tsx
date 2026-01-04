"use client";

import { ReviewRequest, ReviewRequestStatus } from "../types/review";
import Button from "./Button";
import Link from "next/link";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";

interface ReviewRequestCardProps {
  request: ReviewRequest;
  onCancel?: (requestId: string) => void;
  showActions?: boolean;
}

const getStatusConfig = (status: ReviewRequestStatus) => {
  switch (status) {
    case ReviewRequestStatus.PENDING:
      return {
        label: "در انتظار",
        icon: ClockIcon,
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-300",
      };
    case ReviewRequestStatus.ACCEPTED:
      return {
        label: "پذیرفته شده",
        icon: CheckCircleIconSolid,
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-300",
      };
    case ReviewRequestStatus.REJECTED:
      return {
        label: "رد شده",
        icon: XCircleIcon,
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-300",
      };
    case ReviewRequestStatus.EXPIRED:
      return {
        label: "منقضی شده",
        icon: ExclamationTriangleIcon,
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-300",
      };
    default:
      return {
        label: "نامشخص",
        icon: ClockIcon,
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-300",
      };
  }
};

const getExpirationText = (expiresAt?: string): string | null => {
  if (!expiresAt) return null;

  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null; // Already expired
  if (diffDays === 0) return "امروز منقضی می‌شود";
  if (diffDays === 1) return "فردا منقضی می‌شود";
  return `${diffDays} روز تا انقضا`;
};

export default function ReviewRequestCard({
  request,
  onCancel,
  showActions = true,
}: ReviewRequestCardProps) {
  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;
  const expirationText = getExpirationText(request.expiresAt);

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-brand-dark-blue">
              {request.portfolio?.title || "نمونه کار"}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}
            >
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
          </div>
          {(request.customerName || request.customer?.name) && (
            <p className="text-sm text-brand-medium-blue mb-2">
              مشتری: {request.customerName || request.customer?.name}
            </p>
          )}
          {request.portfolio && (
            <Link
              href={`/dashboard/supplier/portfolio/${request.portfolio.id}`}
              className="text-sm text-brand-medium-blue hover:text-brand-dark-blue hover:underline"
            >
              مشاهده نمونه کار →
            </Link>
          )}
        </div>
        <div className="text-left">
          <span className="text-xs text-brand-medium-gray block">
            {new Date(request.createdAt).toLocaleDateString("fa-IR")}
          </span>
          {expirationText && request.status === ReviewRequestStatus.PENDING && (
            <span className="text-xs text-yellow-600 block mt-1">{expirationText}</span>
          )}
        </div>
      </div>

      {request.message && (
        <div className="mb-4 p-3 bg-brand-off-white rounded-lg border border-brand-medium-gray">
          <p className="text-sm text-brand-medium-blue leading-relaxed">{request.message}</p>
        </div>
      )}

      {showActions && request.status === ReviewRequestStatus.PENDING && onCancel && (
        <div className="flex items-center gap-2 pt-4 border-t border-brand-medium-gray">
          <Button
            variant="danger"
            size="sm"
            onClick={() => onCancel(request.id)}
            className="flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            لغو درخواست
          </Button>
        </div>
      )}

      {request.status === ReviewRequestStatus.ACCEPTED && (
        <div className="mt-4 pt-4 border-t border-brand-medium-gray">
          <p className="text-xs text-green-600">
            ✓ این درخواست پذیرفته شده است. مشتری می‌تواند نظر خود را ثبت کند.
          </p>
        </div>
      )}

      {request.status === ReviewRequestStatus.REJECTED && (
        <div className="mt-4 pt-4 border-t border-brand-medium-gray">
          <p className="text-xs text-red-600">
            این درخواست توسط مشتری رد شده است.
          </p>
        </div>
      )}

      {request.status === ReviewRequestStatus.EXPIRED && (
        <div className="mt-4 pt-4 border-t border-brand-medium-gray">
          <p className="text-xs text-gray-600">
            این درخواست منقضی شده است. می‌توانید درخواست جدیدی ایجاد کنید.
          </p>
        </div>
      )}
    </div>
  );
}

