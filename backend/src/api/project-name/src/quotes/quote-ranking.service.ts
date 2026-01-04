import { Injectable } from '@nestjs/common';
import { Quote } from './entities/quote.entity';
import { RatingService } from '../rating/rating.service';

@Injectable()
export class QuoteRankingService {
  constructor(private readonly ratingService: RatingService) {}

  /**
   * Calculate ranking score for a quote
   * Formula:
   * - Price score: 30% (lower is better)
   * - Supplier rating: 40% (higher is better)
   * - Delivery time: 20% (shorter is better)
   * - Quote age: 10% (newer is better)
   */
  async calculateQuoteScore(
    quote: Quote,
    allQuotes: Quote[],
  ): Promise<number> {
    // Price score (30%) - lower price gets higher score
    const prices = allQuotes.map((q) => Number(q.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const priceScore = priceRange > 0
      ? 30 * (1 - (Number(quote.price) - minPrice) / priceRange)
      : 30;

    // Supplier rating score (40%)
    let ratingScore = 0;
    try {
      const rating = await this.ratingService.getSupplierRating(quote.supplierId);
      // Normalize rating to 0-40 (assuming max rating is 100)
      ratingScore = (rating.totalScore / 100) * 40;
    } catch (error) {
      // If rating not found, use default score
      ratingScore = 20; // Middle score
    }

    // Delivery time score (20%) - shorter delivery gets higher score
    let deliveryScore = 0;
    if (quote.deliveryTimeDays) {
      const deliveryTimes = allQuotes
        .filter((q) => q.deliveryTimeDays)
        .map((q) => q.deliveryTimeDays!);
      if (deliveryTimes.length > 0) {
        const minDelivery = Math.min(...deliveryTimes);
        const maxDelivery = Math.max(...deliveryTimes);
        const deliveryRange = maxDelivery - minDelivery;
        deliveryScore = deliveryRange > 0
          ? 20 * (1 - (quote.deliveryTimeDays - minDelivery) / deliveryRange)
          : 20;
      } else {
        deliveryScore = 10; // Default if no delivery times
      }
    } else {
      deliveryScore = 5; // Lower score if no delivery time specified
    }

    // Quote age score (10%) - newer quotes get higher score
    const now = new Date();
    const quoteAge = now.getTime() - quote.createdAt.getTime();
    const oldestQuote = allQuotes.reduce((oldest, q) => {
      const age = now.getTime() - q.createdAt.getTime();
      return age > oldest ? age : oldest;
    }, 0);
    const ageScore = oldestQuote > 0
      ? 10 * (1 - quoteAge / oldestQuote)
      : 10;

    const totalScore = priceScore + ratingScore + deliveryScore + ageScore;
    return Math.round(totalScore * 100) / 100;
  }

  /**
   * Rank quotes by score (highest first)
   */
  async rankQuotes(quotes: Quote[]): Promise<Quote[]> {
    if (quotes.length === 0) return [];

    const quotesWithScores = await Promise.all(
      quotes.map(async (quote) => ({
        quote,
        score: await this.calculateQuoteScore(quote, quotes),
      })),
    );

    quotesWithScores.sort((a, b) => b.score - a.score);

    return quotesWithScores.map((item) => item.quote);
  }
}

