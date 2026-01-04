"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function CustomerRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  useEffect(() => {
    if (customerId) {
      router.replace(`/public/customer/${customerId}`);
    }
  }, [customerId, router]);

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
