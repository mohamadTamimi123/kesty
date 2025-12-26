"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Category } from "../types/category";

interface CategoryCardProps {
  category: Category;
  citySlug?: string;
}

export default function CategoryCard({ category, citySlug }: CategoryCardProps) {
  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const apiUrl =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3000", ":3001")
        : "http://localhost:3001";
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${apiUrl}/api${path}`;
  };

  const href = citySlug
    ? `/city/${citySlug}/category/${category.slug}`
    : `/category/${category.slug}`;

  const imageUrl = getImageUrl(category.iconUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link href={href} className="block h-full">
        <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl border border-brand-light-gray">
          {/* Hero Image Section */}
          <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-brand-light-sky to-brand-medium-blue/20">
            {imageUrl ? (
              <>
                <motion.div
                  className="absolute inset-0"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Image
                    src={imageUrl}
                    alt={category.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </motion.div>
                {/* Gradient Overlay with Brand Colors */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark-blue/70 via-brand-medium-blue/30 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-medium-blue/30 to-brand-dark-blue/20">
                <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                  <span className="text-4xl font-bold text-brand-dark-blue">
                    {category.title.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            {/* Icon Badge (if exists and image exists) */}
            {imageUrl && category.iconUrl && (
              <div className="absolute top-4 right-4 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-brand-light-gray">
                <Image
                  src={imageUrl}
                  alt={category.title}
                  width={32}
                  height={32}
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col p-6 space-y-4">
            {/* Title */}
            <h3 className="text-xl font-bold text-brand-dark-blue font-display group-hover:text-brand-medium-blue transition-colors duration-300">
              {category.title}
            </h3>

            {/* Description */}
            {category.description && (
              <p className="text-sm text-brand-medium-blue line-clamp-2 leading-relaxed flex-1">
                {category.description}
              </p>
            )}

            {/* CTA Button */}
            <motion.div
              className="flex items-center gap-2 text-brand-medium-blue font-semibold text-sm mt-auto"
              whileHover={{ x: -4 }}
              transition={{ duration: 0.2 }}
            >
              <span>مشاهده بیشتر</span>
              <motion.div
                animate={{ x: [0, -4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
