"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Loading from "./Loading";

export default function RouteLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const prevPathRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    
    if (currentPath !== prevPathRef.current && prevPathRef.current !== "") {
      setLoading(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Hide loading after route change completes
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, 300);

      prevPathRef.current = currentPath;
    } else {
      prevPathRef.current = currentPath;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, searchParams]);

  if (!loading) return null;

  return <Loading />;
}

