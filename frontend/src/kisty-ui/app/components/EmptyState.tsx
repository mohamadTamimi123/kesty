"use client";

import { ReactNode } from "react";
import Button from "./Button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  variant?: "default" | "minimal";
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  variant = "default",
}: EmptyStateProps) {
  const content = (
    <>
      {icon && (
        <div className="mb-4 flex justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-brand-medium-blue mb-6 max-w-md">
          {description}
        </p>
      )}
      {(actionLabel && (actionHref || actionOnClick)) && (
        <div>
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={actionOnClick}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </>
  );

  if (variant === "minimal") {
    return (
      <div className="text-center py-8">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {content}
    </div>
  );
}
