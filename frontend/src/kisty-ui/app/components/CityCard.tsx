"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { City } from "../types/city";

interface CityCardProps {
  city: City;
  categorySlug?: string;
}

export default function CityCard({ city, categorySlug }: CityCardProps) {
  const getLogoUrl = (logoUrl: string | null) => {
    if (!logoUrl) return null;
    if (logoUrl.startsWith("http")) return logoUrl;
    const apiUrl =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3000", ":3001")
        : "http://localhost:3001";
    const path = logoUrl.startsWith("/") ? logoUrl : `/${logoUrl}`;
    return `${apiUrl}/api${path}`;
  };

  const href = categorySlug
    ? `/city/${city.slug}/category/${categorySlug}`
    : `/city/${city.slug}`;

  const logoUrl = getLogoUrl(city.logoUrl);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group"
    >
      <Link href={href} className="block h-full">
        <div className="relative bg-white rounded-2xl shadow-md overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg border border-brand-light-gray hover:border-brand-medium-blue/30">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-light-sky/30 via-transparent to-brand-medium-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Content */}
          <div className="relative flex items-center gap-3 p-4">
            {logoUrl ? (
              <motion.div
                className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-brand-light-gray border-2 border-brand-light-gray group-hover:border-brand-medium-blue transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={logoUrl}
                  alt={city.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </motion.div>
            ) : (
              <div className="relative w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-brand-medium-blue to-brand-dark-blue flex items-center justify-center border-2 border-brand-light-gray group-hover:border-brand-medium-blue transition-colors duration-300">
                <span className="text-xl font-bold text-white">
                  {city.title.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-brand-dark-blue group-hover:text-brand-medium-blue transition-colors duration-300 truncate font-display">
                {city.title}
              </h3>
            </div>
            
            {/* Arrow Icon */}
            <motion.div
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              animate={{ x: [0, -4, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <svg
                className="w-5 h-5 text-brand-medium-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
