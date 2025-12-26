import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Portfolio,
  CreatePortfolioData,
  UpdatePortfolioData,
} from '../types/portfolio';
import {
  Review,
  ReviewRequest,
  CreateReviewData,
  CreateReviewRequestData,
} from '../types/review';
import { SupplierRating } from '../types/rating';
import { Machine, CreateMachineData, UpdateMachineData } from '../types/machine';
import { Material, CreateMaterialData, UpdateMaterialData } from '../types/material';
import {
  ChangelogTask,
  ChangelogStats,
  CreateChangelogTaskData,
  UpdateChangelogTaskData,
  ChangelogFilters,
  TaskStatus,
} from '../types/changelog';

// Get API URL - use environment variable or detect from current hostname
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In browser, use current hostname with API port
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001/api`;
  }
  
  // Fallback for server-side
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
      
      // Set cookie with proper expiration for middleware access
      const expires = new Date();
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      
      // Set cookie with multiple attempts to ensure it's set
      const cookieValue = `accessToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      document.cookie = cookieValue;
      
      // Force update (some browsers need this)
      if (window.location.protocol === 'https:') {
        document.cookie = `${cookieValue}; Secure`;
      }
      
      console.log('Token set in localStorage and cookie');
    }
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      // Clear cookie
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  // Auth methods
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

  // Admin - Users management
  async getUsers() {
    const response = await this.client.get('/admin/users');
    return response.data;
  }

  async getUserById(id: string) {
    const response = await this.client.get(`/admin/users/${id}`);
    return response.data;
  }

  async createUser(data: {
    name: string;
    phone: string;
    email: string;
    role: string;
    password: string;
  }) {
    const response = await this.client.post('/admin/users', data);
    return response.data;
  }

  async updateUser(id: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
    status?: string;
    password?: string;
  }) {
    const response = await this.client.put(`/admin/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/admin/users/${id}`);
    return response.data;
  }

  // Admin - Cities management
  async getCities() {
    const response = await this.client.get('/admin/cities');
    return response.data;
  }

  async getCityById(id: string) {
    const response = await this.client.get(`/admin/cities/${id}`);
    return response.data;
  }

  // Public - Cities
  async getCityBySlug(slug: string) {
    const response = await this.client.get(`/cities/${slug}`);
    return response.data;
  }

  async getActiveCities() {
    const response = await this.client.get('/cities');
    return response.data;
  }

  async createCity(data: {
    title: string;
    slug?: string;
    description?: string;
    logo?: File;
  }) {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.slug) {
      formData.append('slug', data.slug);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.logo) {
      formData.append('logo', data.logo);
    }

    const response = await this.client.post('/admin/cities', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateCity(id: string, data: {
    title?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
    logo?: File;
  }) {
    const formData = new FormData();
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.slug) {
      formData.append('slug', data.slug);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description);
    }
    if (data.isActive !== undefined) {
      formData.append('isActive', data.isActive.toString());
    }
    if (data.logo) {
      formData.append('logo', data.logo);
    }

    const response = await this.client.put(`/admin/cities/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteCity(id: string) {
    const response = await this.client.delete(`/admin/cities/${id}`);
    return response.data;
  }

  // Admin - Categories management
  async getCategories() {
    const response = await this.client.get('/admin/categories');
    return response.data;
  }

  async getCategoryById(id: string) {
    const response = await this.client.get(`/admin/categories/${id}`);
    return response.data;
  }

  async createCategory(data: {
    title: string;
    slug?: string;
    description?: string;
    icon?: File;
    metaTitle?: string;
    metaDescription?: string;
  }) {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.slug) {
      formData.append('slug', data.slug);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.icon) {
      formData.append('icon', data.icon);
    }
    if (data.metaTitle) {
      formData.append('metaTitle', data.metaTitle);
    }
    if (data.metaDescription) {
      formData.append('metaDescription', data.metaDescription);
    }

    const response = await this.client.post('/admin/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateCategory(id: string, data: {
    title?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
    icon?: File;
    metaTitle?: string;
    metaDescription?: string;
  }) {
    const formData = new FormData();
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.slug) {
      formData.append('slug', data.slug);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description);
    }
    if (data.isActive !== undefined) {
      formData.append('isActive', data.isActive.toString());
    }
    if (data.icon) {
      formData.append('icon', data.icon);
    }
    if (data.metaTitle) {
      formData.append('metaTitle', data.metaTitle);
    }
    if (data.metaDescription) {
      formData.append('metaDescription', data.metaDescription);
    }

    const response = await this.client.put(`/admin/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteCategory(id: string) {
    const response = await this.client.delete(`/admin/categories/${id}`);
    return response.data;
  }

  // Public - Categories
  async getCategoryBySlug(slug: string) {
    const response = await this.client.get(`/categories/${slug}`);
    return response.data;
  }

  async getActiveCategories() {
    const response = await this.client.get('/categories');
    return response.data;
  }

  // Projects management
  async createProject(data: {
    title: string;
    description: string;
    cityId: string;
    categoryId: string;
    quantityEstimate?: string;
    isPublic?: boolean;
    files?: File[];
  }) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('cityId', data.cityId);
    formData.append('categoryId', data.categoryId);
    if (data.quantityEstimate) {
      formData.append('quantityEstimate', data.quantityEstimate);
    }
    if (data.isPublic !== undefined) {
      formData.append('isPublic', data.isPublic.toString());
    }
    if (data.files) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await this.client.post('/projects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getMyProjects() {
    const response = await this.client.get('/projects/my');
    return response.data;
  }

  async getPublicProjects() {
    const response = await this.client.get('/projects/public');
    return response.data;
  }

  async getProjectById(id: string) {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async updateProject(id: string, data: {
    title?: string;
    description?: string;
    quantityEstimate?: string;
    status?: string;
    isPublic?: boolean;
  }) {
    const response = await this.client.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string) {
    const response = await this.client.delete(`/projects/${id}`);
    return response.data;
  }

  // Generic methods
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Portfolio methods
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

  async requestReview(portfolioId: string, customerId: string, message?: string): Promise<void> {
    await this.client.post(`/portfolio/${portfolioId}/request-review`, {
      customerId,
      message,
    });
  }

  // Review methods
  async createReview(data: CreateReviewData): Promise<Review> {
    const response = await this.client.post('/reviews', data);
    return response.data;
  }

  async getMyReviews(): Promise<ReviewRequest[]> {
    const response = await this.client.get('/reviews/my-reviews');
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

  async acceptReviewRequest(requestId: string): Promise<void> {
    await this.client.post(`/reviews/request/${requestId}/accept`);
  }

  async rejectReviewRequest(requestId: string): Promise<void> {
    await this.client.post(`/reviews/request/${requestId}/reject`);
  }

  // Rating methods
  async getSupplierRating(supplierId: string): Promise<SupplierRating> {
    const response = await this.client.get(`/rating/supplier/${supplierId}`);
    return response.data;
  }

  async getTopSuppliers(limit?: number): Promise<any[]> {
    const response = await this.client.get('/rating/top-suppliers', {
      params: { limit },
    });
    return response.data;
  }

  // Machine methods
  async getMachines(categoryId?: string): Promise<Machine[]> {
    const response = await this.client.get('/machines', {
      params: { categoryId },
    });
    return response.data;
  }

  async getMachineById(id: string): Promise<Machine> {
    const response = await this.client.get(`/machines/${id}`);
    return response.data;
  }

  async createMachine(data: CreateMachineData): Promise<Machine> {
    const response = await this.client.post('/machines', data);
    return response.data;
  }

  async updateMachine(id: string, data: UpdateMachineData): Promise<Machine> {
    const response = await this.client.put(`/machines/${id}`, data);
    return response.data;
  }

  async deleteMachine(id: string): Promise<void> {
    await this.client.delete(`/machines/${id}`);
  }

  // Material methods
  async getMaterials(categoryId?: string): Promise<Material[]> {
    const response = await this.client.get('/materials', {
      params: { categoryId },
    });
    return response.data;
  }

  async getMaterialById(id: string): Promise<Material> {
    const response = await this.client.get(`/materials/${id}`);
    return response.data;
  }

  async createMaterial(data: CreateMaterialData): Promise<Material> {
    const response = await this.client.post('/materials', data);
    return response.data;
  }

  async updateMaterial(id: string, data: UpdateMaterialData): Promise<Material> {
    const response = await this.client.put(`/materials/${id}`, data);
    return response.data;
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.client.delete(`/materials/${id}`);
  }

  // Changelog
  async getChangelogTasks(filters?: ChangelogFilters): Promise<ChangelogTask[]> {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.changeType) params.changeType = filters.changeType;
    if (filters?.relatedModule) params.relatedModule = filters.relatedModule;
    if (filters?.testStatus) params.testStatus = filters.testStatus;
    if (filters?.search) params.search = filters.search;
    
    const response = await this.client.get('/changelog', { params });
    return response.data;
  }

  async getChangelogTaskById(id: string): Promise<ChangelogTask> {
    const response = await this.client.get(`/changelog/${id}`);
    return response.data;
  }

  async getChangelogStats(): Promise<ChangelogStats> {
    const response = await this.client.get('/changelog/stats');
    return response.data;
  }

  async createChangelogTask(data: CreateChangelogTaskData): Promise<ChangelogTask> {
    const response = await this.client.post('/changelog', data);
    return response.data;
  }

  async updateChangelogTask(
    id: string,
    data: UpdateChangelogTaskData,
  ): Promise<ChangelogTask> {
    const response = await this.client.patch(`/changelog/${id}`, data);
    return response.data;
  }

  async deleteChangelogTask(id: string): Promise<void> {
    await this.client.delete(`/changelog/${id}`);
  }

  // Educational Articles
  async getEducationalArticles(published?: boolean): Promise<EducationalArticle[]> {
    const params = published !== undefined ? { published: published.toString() } : {};
    const response = await this.client.get('/educational-articles', { params });
    return response.data;
  }

  async getEducationalArticleById(id: string): Promise<EducationalArticle> {
    const response = await this.client.get(`/educational-articles/${id}`);
    return response.data;
  }

  async getEducationalArticleBySlug(slug: string): Promise<EducationalArticle> {
    const response = await this.client.get(`/educational-articles/slug/${slug}`);
    return response.data;
  }

  async getPopularArticles(limit?: number): Promise<EducationalArticle[]> {
    const params = limit ? { limit: limit.toString() } : {};
    const response = await this.client.get('/educational-articles/popular', { params });
    return response.data;
  }

  async getArticlesByCategory(categoryId: string): Promise<EducationalArticle[]> {
    const response = await this.client.get(`/educational-articles/category/${categoryId}`);
    return response.data;
  }

  async createEducationalArticle(
    data: CreateEducationalArticleData,
  ): Promise<EducationalArticle> {
    const response = await this.client.post('/educational-articles', data);
    return response.data;
  }

  async updateEducationalArticle(
    id: string,
    data: UpdateEducationalArticleData,
  ): Promise<EducationalArticle> {
    const response = await this.client.patch(`/educational-articles/${id}`, data);
    return response.data;
  }

  async deleteEducationalArticle(id: string): Promise<void> {
    await this.client.delete(`/educational-articles/${id}`);
  }

  // Machine Listings
  async getMachineListings(filters?: MachineListingFilters): Promise<MachineListing[]> {
    const params: any = {};
    if (filters) {
      if (filters.cityId) params.cityId = filters.cityId;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.subCategoryId) params.subCategoryId = filters.subCategoryId;
      if (filters.machineId) params.machineId = filters.machineId;
      if (filters.listingType) params.listingType = filters.listingType;
      if (filters.condition) params.condition = filters.condition;
      if (filters.minPrice !== undefined) params.minPrice = filters.minPrice.toString();
      if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice.toString();
      if (filters.isActive !== undefined) params.isActive = filters.isActive.toString();
    }
    const response = await this.client.get('/machine-listings', { params });
    return response.data;
  }

  async getMachineListingById(id: string): Promise<MachineListing> {
    const response = await this.client.get(`/machine-listings/${id}`);
    return response.data;
  }

  async getMachineListingBySlug(slug: string): Promise<MachineListing> {
    const response = await this.client.get(`/machine-listings/slug/${slug}`);
    return response.data;
  }

  async createMachineListing(data: CreateMachineListingData): Promise<MachineListing> {
    const response = await this.client.post('/machine-listings', data);
    return response.data;
  }

  async updateMachineListing(
    id: string,
    data: UpdateMachineListingData,
  ): Promise<MachineListing> {
    const response = await this.client.patch(`/machine-listings/${id}`, data);
    return response.data;
  }

  async deleteMachineListing(id: string): Promise<void> {
    await this.client.delete(`/machine-listings/${id}`);
  }

  // Messaging methods
  async getConversations() {
    const response = await this.client.get('/messaging/conversations');
    return response.data;
  }

  async getConversation(id: string) {
    const response = await this.client.get(`/messaging/conversations/${id}`);
    return response.data;
  }

  async createConversation(supplierId: string) {
    const response = await this.client.post('/messaging/conversations', {
      supplierId,
    });
    return response.data;
  }

  async getMessages(conversationId: string, limit = 50, offset = 0) {
    const response = await this.client.get(
      `/messaging/conversations/${conversationId}/messages`,
      { params: { limit, offset } },
    );
    return response.data;
  }

  async sendMessage(conversationId: string, content: string) {
    const response = await this.client.post('/messaging/messages', {
      conversationId,
      content,
    });
    return response.data;
  }

  async markConversationAsRead(conversationId: string) {
    const response = await this.client.post(
      `/messaging/conversations/${conversationId}/read`,
    );
    return response.data;
  }

  async getUnreadCount() {
    const response = await this.client.get('/messaging/unread-count');
    return response.data;
  }

  // Supplier methods
  async getSupplierBySlug(slug: string) {
    const response = await this.client.get(`/suppliers/${slug}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

