"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = "md", 
  text = "در حال بارگذاری...",
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50"
    : "flex flex-col items-center justify-center py-12";

  return (
    <div className={containerClasses}>
      <div className={`animate-spin rounded-full border-b-2 border-brand-medium-blue ${sizeClasses[size]} mb-4`}></div>
      {text && (
        <p className="text-brand-medium-blue text-sm">{text}</p>
      )}
    </div>
  );
}
