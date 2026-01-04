"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

interface WorkflowCardProps {
  icon: ReactNode;
  title: string;
  
  description: string;
  href: string;
  iconBgColor?: string;
  iconColor?: string;
  showArrow?: boolean;
}

export default function WorkflowCard({
  icon,
  title,
  description,
  href,
  iconBgColor = "bg-brand-light-sky",
  iconColor = "text-brand-medium-blue",
  showArrow = true,
}: WorkflowCardProps) {
  return (
    <Link href={href} className="block h-full">
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-16 h-16 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        
        </div>
        <div className="flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-brand-dark-blue mb-2 font-display">
            {title}
          </h3>
          <p className="text-sm text-brand-medium-blue leading-relaxed flex-1">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
