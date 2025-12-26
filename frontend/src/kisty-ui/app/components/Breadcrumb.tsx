"use client";

import Link from "next/link";
import { ChevronLeftIcon, HomeIcon } from "@heroicons/react/24/outline";

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
      <Link
        href="/"
        className="flex items-center text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
      >
        <HomeIcon className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronLeftIcon className="w-4 h-4 text-brand-medium-gray" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-brand-dark-blue font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

