"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function PortfolioRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;

  useEffect(() => {
    if (portfolioId) {
      router.replace(`/public/portfolio/${portfolioId}`);
    }
  }, [portfolioId, router]);

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
