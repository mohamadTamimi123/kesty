"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProjectsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/public/projects");
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
