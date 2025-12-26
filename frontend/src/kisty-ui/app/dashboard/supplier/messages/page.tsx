"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SupplierMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/messaging");
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-medium-blue mx-auto"></div>
        <p className="mt-4 text-brand-medium-blue">در حال انتقال...</p>
      </div>
    </div>
  );
}

