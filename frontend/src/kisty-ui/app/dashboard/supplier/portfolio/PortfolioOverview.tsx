"use client";

import { useState, useEffect } from "react";
import { Portfolio } from "../../../types/portfolio";
import apiClient from "../../../lib/api";
import logger from "../../../utils/logger";
import {
  PhotoIcon,
  EyeIcon,
  StarIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface PortfolioOverviewProps {
  portfolios: Portfolio[];
  onStatsUpdate?: (stats: PortfolioStats) => void;
}

export interface PortfolioStats {
  total: number;
  totalViews: number;
  averageRating: number;
  verifiedCount: number;
  publicCount: number;
}

export default function PortfolioOverview({
  portfolios,
  onStatsUpdate,
}: PortfolioOverviewProps) {
  const [stats, setStats] = useState<PortfolioStats>({
    total: 0,
    totalViews: 0,
    averageRating: 0,
    verifiedCount: 0,
    publicCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateStats = () => {
      const total = portfolios.length;
      const totalViews = portfolios.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      const ratings = portfolios.filter((p) => p.rating && p.rating > 0).map((p) => p.rating!);
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : 0;
      const verifiedCount = portfolios.filter((p) => p.isVerified).length;
      const publicCount = portfolios.filter((p) => p.isPublic).length;

      const calculatedStats: PortfolioStats = {
        total,
        totalViews,
        averageRating: Math.round(averageRating * 10) / 10,
        verifiedCount,
        publicCount,
      };

      setStats(calculatedStats);
      if (onStatsUpdate) {
        onStatsUpdate(calculatedStats);
      }
      setIsLoading(false);
    };

    // Try to fetch stats from API first
    const fetchStats = async () => {
      try {
        const apiStats = await apiClient.getPortfolioStats();
        setStats({
          total: apiStats.total || portfolios.length,
          totalViews: apiStats.totalViews || 0,
          averageRating: apiStats.averageRating || 0,
          verifiedCount: apiStats.verifiedCount || 0,
          publicCount: apiStats.publicCount || 0,
        });
        if (onStatsUpdate) {
          onStatsUpdate({
            total: apiStats.total || portfolios.length,
            totalViews: apiStats.totalViews || 0,
            averageRating: apiStats.averageRating || 0,
            verifiedCount: apiStats.verifiedCount || 0,
            publicCount: apiStats.publicCount || 0,
          });
        }
        setIsLoading(false);
      } catch (error) {
        logger.error("Error fetching portfolio stats", error);
        // Fallback to calculated stats
        calculateStats();
      }
    };

    if (portfolios.length > 0) {
      fetchStats();
    } else {
      calculateStats();
    }
  }, [portfolios, onStatsUpdate]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6 mb-8">
        <div className="text-center text-brand-medium-blue py-8">در حال بارگذاری آمار...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
          <div className="flex items-center gap-2 mb-2">
            <PhotoIcon className="w-5 h-5 text-brand-medium-blue" />
            <span className="text-sm text-brand-medium-blue">کل نمونه کارها</span>
          </div>
          <div className="text-2xl font-bold text-brand-dark-blue">{stats.total}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
          <div className="flex items-center gap-2 mb-2">
            <EyeIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-brand-medium-blue">بازدید کل</span>
          </div>
          <div className="text-2xl font-bold text-brand-dark-blue">
            {stats.totalViews.toLocaleString("fa-IR")}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
          <div className="flex items-center gap-2 mb-2">
            <StarIcon className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-brand-medium-blue">میانگین امتیاز</span>
          </div>
          <div className="text-2xl font-bold text-brand-dark-blue">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm text-brand-medium-blue">تایید شده</span>
          </div>
          <div className="text-2xl font-bold text-brand-dark-blue">{stats.verifiedCount}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
          <div className="flex items-center gap-2 mb-2">
            <GlobeAltIcon className="w-5 h-5 text-brand-medium-blue" />
            <span className="text-sm text-brand-medium-blue">عمومی</span>
          </div>
          <div className="text-2xl font-bold text-brand-dark-blue">{stats.publicCount}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-brand-medium-blue">خصوصی</span>
          </div>
          <div className="text-2xl font-bold text-brand-dark-blue">
            {stats.total - stats.publicCount}
          </div>
        </div>
      </div>

    </div>
  );
}

