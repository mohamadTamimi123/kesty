"use client";

export default function ChangelogSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-brand-medium-gray p-6 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-5 h-5 bg-gray-200 rounded-full mt-1" />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="flex gap-2">
                  <div className="h-6 w-24 bg-gray-200 rounded" />
                  <div className="h-6 w-24 bg-gray-200 rounded" />
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

