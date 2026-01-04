import { BaseApiClient } from './base';
import {
  Portfolio,
  CreatePortfolioData,
  UpdatePortfolioData,
} from '../../types/portfolio';

export class PortfolioApi extends BaseApiClient {
  async uploadPortfolioImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await this.client.post('/portfolio/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.imageUrls;
  }

  async createPortfolio(data: CreatePortfolioData): Promise<Portfolio> {
    const response = await this.client.post('/portfolio', data);
    return response.data;
  }

  async updatePortfolio(id: string, data: UpdatePortfolioData): Promise<Portfolio> {
    const response = await this.client.put(`/portfolio/${id}`, data);
    return response.data;
  }

  async deletePortfolio(id: string): Promise<void> {
    await this.client.delete(`/portfolio/${id}`);
  }

  async getMyPortfolios(): Promise<Portfolio[]> {
    const response = await this.client.get('/portfolio/my-portfolios');
    return response.data;
  }

  async getSupplierPortfolios(supplierId: string): Promise<Portfolio[]> {
    const response = await this.client.get(`/portfolio/supplier/${supplierId}`);
    return response.data;
  }

  async getPortfolioById(id: string): Promise<Portfolio> {
    const response = await this.client.get(`/portfolio/${id}`);
    return response.data;
  }

  async getPendingPortfolios(page: number = 1, limit: number = 20): Promise<{
    data: Portfolio[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.client.get('/portfolio/pending', {
      params: { page, limit },
    });
    return response.data;
  }

  async verifyPortfolio(id: string): Promise<Portfolio> {
    const response = await this.client.put(`/portfolio/${id}/verify`);
    return response.data;
  }

  async unverifyPortfolio(id: string): Promise<Portfolio> {
    const response = await this.client.put(`/portfolio/${id}/unverify`);
    return response.data;
  }

  async requestReview(portfolioId: string, customerId: string, message?: string): Promise<void> {
    await this.client.post(`/portfolio/${portfolioId}/request-review`, {
      customerId,
      message,
    });
  }

  async getPortfolioStats(): Promise<{
    total: number;
    totalViews: number;
    averageRating: number;
    verifiedCount: number;
    publicCount: number;
    recentPortfolios: Portfolio[];
    topPortfolios: Portfolio[];
  }> {
    const response = await this.client.get('/portfolio/stats');
    return response.data;
  }
}

