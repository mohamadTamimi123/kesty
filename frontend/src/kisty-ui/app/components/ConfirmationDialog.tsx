"use client";

import { Fragment, useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Button from "./Button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "تایید",
  cancelText = "انصراف",
  onConfirm,
  onCancel,
  onClose,
  variant = "warning",
}: ConfirmationDialogProps) {
  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll when dialog closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const variantClasses = {
    danger: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${variantClasses[variant]}`}>
            <ExclamationTriangleIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">{title}</h3>
            <p className="text-brand-medium-blue mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="neutral" onClick={handleCancel}>
                {cancelText}
              </Button>
              <Button
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

