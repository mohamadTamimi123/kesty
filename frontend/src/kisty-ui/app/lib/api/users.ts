import { BaseApiClient } from './base';

export class UsersApi extends BaseApiClient {
  async getMyProfile() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async updateMyProfile(data: {
    fullName?: string;
    phone?: string;
    email?: string;
    workshopName?: string;
    workshopAddress?: string;
    workshopPhone?: string;
    address?: string;
    city?: string;
    bio?: string;
    specialties?: string;
    experience?: string;
  }) {
    const response = await this.client.put('/users/me/profile', data);
    return response.data;
  }

  async searchCustomers(query: string, limit: number = 10): Promise<any[]> {
    const response = await this.client.get('/users/search', {
      params: { q: query, role: 'CUSTOMER', limit },
    });
    return Array.isArray(response.data) ? response.data : [];
  }

  async uploadProfileImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.client.post('/users/me/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

