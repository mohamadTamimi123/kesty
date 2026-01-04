"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
  badge?: ReactNode;
  subtitleClassName?: string;
}

export default function StatsCard({
  icon,
  value,
  label,
  subtitle,
  onClick,
  className = "",
  iconBgColor = "bg-brand-light-sky",
  iconColor = "text-brand-medium-blue",
  valueColor = "text-brand-dark-blue",
  badge,
  subtitleClassName = "text-brand-medium-blue",
}: StatsCardProps) {
  const baseClasses = "bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow";
  const clickableClasses = onClick ? "cursor-pointer" : "";
  
  const content = (
    <>
      <div className="flex items-center justify-between mb-4 relative">
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        {badge && (
          <div className="absolute -top-1 -right-1">
            {badge}
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${valueColor} mb-1`}>
        {value}
      </div>
      <div className="text-sm text-brand-medium-blue">{label}</div>
      {subtitle && (
        <div className={`text-xs mt-1 ${subtitleClassName}`}>{subtitle}</div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${clickableClasses} ${className} text-right w-full`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      {content}
    </div>
  );
}
