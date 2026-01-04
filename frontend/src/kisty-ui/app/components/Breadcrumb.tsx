"use client";

import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronLeftIcon className="w-4 h-4 text-brand-medium-gray" />
            )}
            {isLast ? (
              <span className="text-brand-dark-blue font-medium" aria-current="page">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-brand-medium-blue">{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
