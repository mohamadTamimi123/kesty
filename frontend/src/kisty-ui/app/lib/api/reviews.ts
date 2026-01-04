import { BaseApiClient } from './base';
import {
  Review,
  ReviewRequest,
  CreateReviewData,
  CreateReviewRequestData,
  ReviewRequestStatus,
} from '../../types/review';
import logger from '../../utils/logger';

export class ReviewsApi extends BaseApiClient {
  async createReview(data: CreateReviewData): Promise<Review> {
    const response = await this.client.post('/reviews', data);
    return response.data;
  }

  async getMyReviews(): Promise<ReviewRequest[]> {
    const response = await this.client.get('/reviews/my-reviews');
    return response.data;
  }

  async getReviewRequest(requestId: string): Promise<ReviewRequest> {
    const response = await this.client.get(`/reviews/request/${requestId}`);
    return response.data;
  }

  async getSupplierReviews(): Promise<Review[]> {
    const response = await this.client.get('/reviews/my-supplier-reviews');
    return response.data;
  }

  async getPortfolioReviews(portfolioId: string): Promise<Review[]> {
    const response = await this.client.get(`/reviews/portfolio/${portfolioId}`);
    return response.data;
  }

  async createReviewRequest(data: CreateReviewRequestData): Promise<ReviewRequest> {
    const response = await this.client.post('/reviews/request', data);
    return response.data;
  }

  async getReviewRequestByToken(token: string): Promise<ReviewRequest> {
    const response = await this.client.get(`/reviews/token/${token}`);
    return response.data;
  }

  async createReviewWithToken(
    token: string,
    data: CreateReviewData & { customerName: string; customerEmail?: string },
  ): Promise<Review> {
    const response = await this.client.post(`/reviews/token/${token}`, data);
    return response.data;
  }

  async getSupplierReviewRequests(status?: ReviewRequestStatus): Promise<ReviewRequest[]> {
    try {
      const params = status ? { status } : {};
      const response = await this.client.get('/reviews/requests', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      if (error?.response?.status === 500 || error?.response?.status === 404) {
        logger.warn("Review requests endpoint not available, returning empty array");
        return [];
      }
      throw error;
    }
  }

  async cancelReviewRequest(requestId: string): Promise<void> {
    await this.client.delete(`/reviews/request/${requestId}`);
  }

  async acceptReviewRequest(requestId: string): Promise<void> {
    await this.client.post(`/reviews/request/${requestId}/accept`);
  }

  async rejectReviewRequest(requestId: string): Promise<void> {
    await this.client.post(`/reviews/request/${requestId}/reject`);
  }

  async getPendingReviews() {
    const response = await this.client.get('/reviews/pending-requests');
    return response.data;
  }

  async approveReview(id: string) {
    const response = await this.client.post(`/admin/reviews/${id}/approve`);
    return response.data;
  }

  async rejectReview(id: string) {
    const response = await this.client.post(`/admin/reviews/${id}/reject`);
    return response.data;
  }

  async deleteReview(id: string) {
    const response = await this.client.delete(`/admin/reviews/${id}`);
    return response.data;
  }
}

