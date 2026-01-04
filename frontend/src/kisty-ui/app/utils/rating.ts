/**
 * Rating calculation utilities according to Kisty documentation
 * 
 * Formula: Total Score = Sum of Base Scores - Penalties
 * 
 * Factors and Weights:
 * - Premium Plan: 30% (30 points)
 * - User Reviews: 25% (25 points)
 * - Profile Completion: 20% (20 points)
 * - Response Speed: 15% (15 points)
 * - Recent Activity: 10% (10 points)
 * 
 * Maximum Score: 100 points
 */

import { PremiumLevel } from '../types/rating';

export interface RatingCalculationData {
  premiumLevel?: PremiumLevel;
  averageRating?: number; // 1-5
  reviewCount?: number;
  profileData?: any;
  avgResponseTimeHours?: number;
  penalties?: number;
}

export interface RatingBreakdown {
  premiumScore: number;
  reviewScore: number;
  profileScore: number;
  responseScore: number;
  activityScore: number;
  penalties: number;
  totalScore: number;
}

/**
 * Calculate premium score (30 points max)
 * Gold: 30, Silver: 24, Bronze: 18, None: 0
 */
export function calculatePremiumScore(premiumLevel?: PremiumLevel): number {
  switch (premiumLevel) {
    case PremiumLevel.GOLD:
      return 30;
    case PremiumLevel.SILVER:
      return 24;
    case PremiumLevel.BRONZE:
      return 18;
    case PremiumLevel.NONE:
    default:
      return 0;
  }
}

/**
 * Calculate review score (25 points max)
 * 70% from average rating (1-5 stars), 30% from review count
 */
export function calculateReviewScore(
  averageRating?: number,
  reviewCount?: number
): number {
  if (!averageRating || !reviewCount || reviewCount === 0) {
    return 0;
  }

  // Normalize rating from 1-5 to 0-1 scale, then multiply by 70% of 25 = 17.5
  const ratingScore = (averageRating / 5) * 17.5;

  // Review count score: more reviews = higher score
  // Scale: 0 reviews = 0, 10+ reviews = 7.5 (30% of 25)
  const countScore = Math.min(reviewCount / 10, 1) * 7.5;

  return Math.round((ratingScore + countScore) * 10) / 10;
}

/**
 * Calculate profile completion score (20 points max)
 * Based on profile completeness percentage
 */
export function calculateProfileScore(profileCompletionPercentage: number): number {
  // Profile completion is already a percentage (0-100)
  // Convert to 20-point scale
  return Math.round((profileCompletionPercentage / 100) * 20 * 10) / 10;
}

/**
 * Calculate response speed score (15 points max)
 * <2 hours: 15, 2-12 hours: 10, >12 hours: 5
 */
export function calculateResponseScore(avgResponseTimeHours?: number): number {
  if (!avgResponseTimeHours || avgResponseTimeHours < 0) {
    return 0;
  }

  if (avgResponseTimeHours < 2) {
    return 15;
  } else if (avgResponseTimeHours <= 12) {
    return 10;
  } else {
    return 5;
  }
}

/**
 * Calculate activity score (10 points max)
 * Same calculation as profile score but scaled to 10 points
 */
export function calculateActivityScore(profileCompletionPercentage: number): number {
  // Same as profile score but scaled to 10 points instead of 20
  return Math.round((profileCompletionPercentage / 100) * 10 * 10) / 10;
}

/**
 * Calculate total rating score
 * Total = Premium + Review + Profile + Response + Activity - Penalties
 */
export function calculateTotalScore(data: RatingCalculationData): RatingBreakdown {
  const premiumScore = calculatePremiumScore(data.premiumLevel);
  const reviewScore = calculateReviewScore(data.averageRating, data.reviewCount);
  
  // Profile completion percentage should be calculated separately
  // For now, assume it's provided or calculate from profileData
  const profileCompletion = data.profileData?.completionPercentage || 0;
  const profileScore = calculateProfileScore(profileCompletion);
  const activityScore = calculateActivityScore(profileCompletion);
  
  const responseScore = calculateResponseScore(data.avgResponseTimeHours);
  const penalties = data.penalties || 0;

  const totalScore = Math.max(0, 
    premiumScore + 
    reviewScore + 
    profileScore + 
    responseScore + 
    activityScore - 
    penalties
  );

  return {
    premiumScore,
    reviewScore,
    profileScore,
    responseScore,
    activityScore,
    penalties,
    totalScore: Math.round(totalScore * 10) / 10,
  };
}

/**
 * Get rating level based on total score
 */
export function getRatingLevel(totalScore: number): string {
  if (totalScore >= 80) {
    return 'عالی';
  } else if (totalScore >= 60) {
    return 'خوب';
  } else if (totalScore >= 40) {
    return 'متوسط';
  } else if (totalScore >= 20) {
    return 'ضعیف';
  } else {
    return 'خیلی ضعیف';
  }
}

