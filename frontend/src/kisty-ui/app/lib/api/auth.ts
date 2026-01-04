import { BaseApiClient } from './base';

export class AuthApi extends BaseApiClient {
  async register(data: { phone: string; fullName: string; password?: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async verifyOtp(data: { phone: string; otp: string; fullName?: string; role?: string }) {
    const response = await this.client.post('/auth/verify-otp', data);
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    return response.data;
  }

  async login(data: { phone: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async googleAuth(data: { idToken: string }) {
    const response = await this.client.post('/auth/google', data);
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    this.clearToken();
    return response.data;
  }

  async getOtp(phone: string) {
    const response = await this.client.get(`/auth/otp?phone=${encodeURIComponent(phone)}`);
    return response.data;
  }
}

