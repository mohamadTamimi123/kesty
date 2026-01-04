"use client";

import { useState } from "react";
import Image from "next/image";
import { useIntersectionObserver } from "../utils/useIntersectionObserver";
import LoadingSpinner from "./LoadingSpinner";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
}: LazyImageProps) {
  const [imageRef, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`bg-brand-light-gray flex items-center justify-center ${className}`}>
        <span className="text-brand-medium-gray text-sm">خطا در بارگذاری تصویر</span>
      </div>
    );
  }

  return (
    <div ref={imageRef} className={className}>
      {isIntersecting || priority ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-light-gray">
              <LoadingSpinner size="sm" />
            </div>
          )}
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            priority={priority}
          />
        </>
      ) : (
        <div className="bg-brand-light-gray flex items-center justify-center w-full h-full">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}

