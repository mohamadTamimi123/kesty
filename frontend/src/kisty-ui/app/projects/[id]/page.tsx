"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function ProjectDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  useEffect(() => {
    if (projectId) {
      router.replace(`/public/projects/${projectId}`);
    }
  }, [projectId, router]);

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

