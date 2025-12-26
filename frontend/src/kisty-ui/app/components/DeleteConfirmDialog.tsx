"use client";

import { ReactNode } from "react";
import Button from "./Button";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "تایید حذف",
  message,
  confirmText = "حذف",
  cancelText = "لغو",
  isLoading = false,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border border-brand-medium-gray animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-medium-gray">
          <h3 className="text-lg font-bold text-brand-dark-blue">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-brand-light-gray transition-colors text-brand-medium-blue hover:text-brand-dark-blue"
            aria-label="بستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-brand-dark-blue mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="neutral"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant="secondary"
              onClick={onConfirm}
              isLoading={isLoading}
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

