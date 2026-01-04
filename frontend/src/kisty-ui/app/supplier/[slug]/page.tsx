"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function SupplierRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      router.replace(`/public/supplier/${slug}`);
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
