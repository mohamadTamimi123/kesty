"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-off-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-brand-light-sky rounded-full"></div>
          <div className="absolute inset-0 border-4 border-brand-medium-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-brand-dark-blue animate-pulse-slow">
          در حال بارگذاری...
        </p>
      </div>
    </div>
  );
}

