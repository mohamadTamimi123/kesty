import { AuthApi } from './auth';
import { UsersApi } from './users';
import { CategoriesApi } from './categories';
import { CitiesApi } from './cities';
import { ProjectsApi } from './projects';
import { PortfolioApi } from './portfolio';
import { ReviewsApi } from './reviews';
import { BaseApiClient } from './base';
import { Project } from '../types/project';
import { Quote } from '../types/quote';
import { Machine, CreateMachineData, UpdateMachineData } from '../types/machine';
import { Material, CreateMaterialData, UpdateMaterialData } from '../types/material';
import {
  ChangelogTask,
  ChangelogStats,
  CreateChangelogTaskData,
  UpdateChangelogTaskData,
  ChangelogFilters,
} from '../types/changelog';
import { EducationalArticle, CreateEducationalArticleData, UpdateEducationalArticleData } from '../types/article';
import { MachineListing, MachineListingFilters, CreateMachineListingData, UpdateMachineListingData } from '../types/machine-listing';
import { SupplierRating } from '../types/rating';
import { ReviewRequestStatus } from '../types/review';
import logger from '../../utils/logger';

// Create API instances
const authApi = new AuthApi();
const usersApi = new UsersApi();
const categoriesApi = new CategoriesApi();
const citiesApi = new CitiesApi();
const projectsApi = new ProjectsApi();
const portfolioApi = new PortfolioApi();
const reviewsApi = new ReviewsApi();

// Unified API Client that combines all modules
class ApiClient extends BaseApiClient {
  // Auth methods
  register = authApi.register.bind(authApi);
  verifyOtp = authApi.verifyOtp.bind(authApi);
  login = authApi.login.bind(authApi);
  googleAuth = authApi.googleAuth.bind(authApi);
  logout = authApi.logout.bind(authApi);
  getOtp = authApi.getOtp.bind(authApi);

  // User methods
  getMyProfile = usersApi.getMyProfile.bind(usersApi);
  updateMyProfile = usersApi.updateMyProfile.bind(usersApi);
  searchCustomers = usersApi.searchCustomers.bind(usersApi);
  uploadProfileImage = usersApi.uploadProfileImage.bind(usersApi);

  // Category methods
  getCategories = categoriesApi.getCategories.bind(categoriesApi);
  getCategoryById = categoriesApi.getCategoryById.bind(categoriesApi);
  createCategory = categoriesApi.createCategory.bind(categoriesApi);
  updateCategory = categoriesApi.updateCategory.bind(categoriesApi);
  deleteCategory = categoriesApi.deleteCategory.bind(categoriesApi);
  reorderCategories = categoriesApi.reorderCategories.bind(categoriesApi);
  moveCategory = categoriesApi.moveCategory.bind(categoriesApi);
  getCategoryTree = categoriesApi.getCategoryTree.bind(categoriesApi);
  getCategoryBySlug = categoriesApi.getCategoryBySlug.bind(categoriesApi);
  getActiveCategories = categoriesApi.getActiveCategories.bind(categoriesApi);
  getCategoryStats = categoriesApi.getCategoryStats.bind(categoriesApi);
  getCategoryTopSuppliers = categoriesApi.getCategoryTopSuppliers.bind(categoriesApi);
  getCategorySubcategories = categoriesApi.getCategorySubcategories.bind(categoriesApi);
  getCategoryCities = categoriesApi.getCategoryCities.bind(categoriesApi);
  getCategoryArticles = categoriesApi.getCategoryArticles.bind(categoriesApi);
  getCategoryTreePublic = categoriesApi.getCategoryTreePublic.bind(categoriesApi);
  addCategoryToSupplier = categoriesApi.addCategoryToSupplier.bind(categoriesApi);
  removeCategoryFromSupplier = categoriesApi.removeCategoryFromSupplier.bind(categoriesApi);
  getSupplierCategories = categoriesApi.getSupplierCategories.bind(categoriesApi);

  // City methods
  createCity = citiesApi.createCity.bind(citiesApi);
  updateCity = citiesApi.updateCity.bind(citiesApi);
  deleteCity = citiesApi.deleteCity.bind(citiesApi);
  getCityBySlug = citiesApi.getCityBySlug.bind(citiesApi);
  getActiveCities = citiesApi.getActiveCities.bind(citiesApi);
  getCityStats = citiesApi.getCityStats.bind(citiesApi);
  getCityTopSuppliers = citiesApi.getCityTopSuppliers.bind(citiesApi);
  getCityLatestSuppliers = citiesApi.getCityLatestSuppliers.bind(citiesApi);
  getCityCategories = citiesApi.getCityCategories.bind(citiesApi);
  getCityCategorySuppliers = citiesApi.getCityCategorySuppliers.bind(citiesApi);
  getCityCategoryStats = citiesApi.getCityCategoryStats.bind(citiesApi);
  addCityToSupplier = citiesApi.addCityToSupplier.bind(citiesApi);
  removeCityFromSupplier = citiesApi.removeCityFromSupplier.bind(citiesApi);
  getSupplierCities = citiesApi.getSupplierCities.bind(citiesApi);

  // Project methods
  createProject = projectsApi.createProject.bind(projectsApi);
  getMyProjects = projectsApi.getMyProjects.bind(projectsApi);
  getPublicProjects = projectsApi.getPublicProjects.bind(projectsApi);
  getRelevantProjectsForSupplier = projectsApi.getRelevantProjectsForSupplier.bind(projectsApi);
  getProjectById = projectsApi.getProjectById.bind(projectsApi);
  getProjectsBatch = projectsApi.getProjectsBatch.bind(projectsApi);
  updateProject = projectsApi.updateProject.bind(projectsApi);
  deleteProject = projectsApi.deleteProject.bind(projectsApi);
  getRelevantSuppliers = projectsApi.getRelevantSuppliers.bind(projectsApi);
  getExcludedSuppliers = projectsApi.getExcludedSuppliers.bind(projectsApi);

  // Portfolio methods
  uploadPortfolioImages = portfolioApi.uploadPortfolioImages.bind(portfolioApi);
  createPortfolio = portfolioApi.createPortfolio.bind(portfolioApi);
  updatePortfolio = portfolioApi.updatePortfolio.bind(portfolioApi);
  deletePortfolio = portfolioApi.deletePortfolio.bind(portfolioApi);
  getMyPortfolios = portfolioApi.getMyPortfolios.bind(portfolioApi);
  getSupplierPortfolios = portfolioApi.getSupplierPortfolios.bind(portfolioApi);
  getPortfolioById = portfolioApi.getPortfolioById.bind(portfolioApi);
  getPendingPortfolios = portfolioApi.getPendingPortfolios.bind(portfolioApi);
  verifyPortfolio = portfolioApi.verifyPortfolio.bind(portfolioApi);
  unverifyPortfolio = portfolioApi.unverifyPortfolio.bind(portfolioApi);
  requestReview = portfolioApi.requestReview.bind(portfolioApi);
  getPortfolioStats = portfolioApi.getPortfolioStats.bind(portfolioApi);

  // Review methods
  createReview = reviewsApi.createReview.bind(reviewsApi);
  getMyReviews = reviewsApi.getMyReviews.bind(reviewsApi);
  getReviewRequest = reviewsApi.getReviewRequest.bind(reviewsApi);
  getSupplierReviews = reviewsApi.getSupplierReviews.bind(reviewsApi);
  getPortfolioReviews = reviewsApi.getPortfolioReviews.bind(reviewsApi);
  createReviewRequest = reviewsApi.createReviewRequest.bind(reviewsApi);
  getReviewRequestByToken = reviewsApi.getReviewRequestByToken.bind(reviewsApi);
  createReviewWithToken = reviewsApi.createReviewWithToken.bind(reviewsApi);
  getSupplierReviewRequests = reviewsApi.getSupplierReviewRequests.bind(reviewsApi);
  cancelReviewRequest = reviewsApi.cancelReviewRequest.bind(reviewsApi);
  acceptReviewRequest = reviewsApi.acceptReviewRequest.bind(reviewsApi);
  rejectReviewRequest = reviewsApi.rejectReviewRequest.bind(reviewsApi);

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

  // Supplier dashboard stats
  async getSupplierStats(): Promise<{
    newRequests: number;
    activeProjects: number;
    newMessages: number;
    totalPortfolios: number;
    totalReviews: number;
    averageRating: number;
  }> {
    try {
      const response = await this.client.get('/supplier/stats');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return {
          newRequests: 0,
          activeProjects: 0,
          newMessages: 0,
          totalPortfolios: 0,
          totalReviews: 0,
          averageRating: 0,
        };
      }
      throw error;
    }
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

  async uploadArticleFeaturedImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.client.post('/educational-articles/upload-featured-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
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

  async createConversation(supplierId: string, projectId?: string) {
    const response = await this.client.post('/messaging/conversations', {
      supplierId,
      projectId,
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

  async markMessageAsDelivered(messageId: string) {
    const response = await this.client.post(`/messaging/messages/${messageId}/delivered`);
    return response.data;
  }

  async getUserOnlineStatus(userId: string) {
    const response = await this.client.get(`/messaging/user-online-status/${userId}`);
    return response.data;
  }

  async updateLastSeen() {
    const response = await this.client.post('/messaging/update-last-seen');
    return response.data;
  }

  // Supplier methods
  async getSupplierBySlug(slug: string) {
    const response = await this.client.get(`/suppliers/${slug}`);
    return response.data;
  }

  async getPublicSupplierById(id: string) {
    const response = await this.client.get(`/suppliers/${id}`);
    return response.data;
  }

  async getPublicCustomerById(id: string) {
    const response = await this.client.get(`/customers/${id}`);
    return response.data;
  }

  async getSupplierProjects(supplierId: string, page: number = 1, limit: number = 10) {
    const response = await this.client.get('/projects/public', {
      params: { page, limit: 100 },
    });
    const projects = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return {
      data: projects.slice((page - 1) * limit, page * limit),
      total: projects.length,
      page,
      limit,
    };
  }

  async getPublicSuppliers(filters?: {
    cityId?: string;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) {
    const params: any = {
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    };
    
    if (filters?.search) params.search = filters.search;
    if (filters?.cityId) params.cityId = filters.cityId;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.sortBy) params.sortBy = filters.sortBy;

    const response = await this.client.get('/suppliers', { params });
    
    return {
      data: response.data?.data || [],
      total: response.data?.total || 0,
      page: response.data?.page || filters?.page || 1,
      limit: response.data?.limit || filters?.limit || 20,
      totalPages: response.data?.totalPages || 1,
    };
  }

  // Contact methods
  async submitContact(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post('/contact', data);
    return response.data;
  }

  // Admin methods
  async getAdminStats() {
    const response = await this.client.get('/admin/stats');
    return response.data;
  }

  async getSuppliers() {
    const response = await this.client.get('/admin/users');
    const users = Array.isArray(response.data) ? response.data : [];
    return users.filter((user: any) => {
      const role = user.role?.toUpperCase();
      return role === 'SUPPLIER';
    });
  }

  async getSupplierById(id: string) {
    const response = await this.client.get(`/admin/users/${id}`);
    return response.data;
  }

  async approveSupplier(id: string) {
    const response = await this.client.put(`/admin/users/${id}`, {
      isActive: true,
      isBlocked: false,
    });
    return response.data;
  }

  async rejectSupplier(id: string, reason?: string) {
    const response = await this.client.put(`/admin/users/${id}`, {
      isActive: false,
      isBlocked: true,
    });
    return response.data;
  }

  async setSupplierPremium(id: string, isPremium: boolean, premiumLevel?: string) {
    const response = await this.client.put(`/admin/users/${id}`, {
      isPremium,
      premiumLevel: premiumLevel || null,
    });
    return response.data;
  }

  async getAllProjects(filters?: {
    status?: string;
    cityId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.cityId) params.cityId = filters.cityId;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    
    const response = await this.client.get('/projects/all', { params });
    if (response.data?.data) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  }

  async updateProjectStatus(id: string, status: string) {
    const response = await this.client.put(`/projects/${id}`, { status });
    return response.data;
  }

  async getAllConversations(filters?: {
    userId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params: any = {};
    if (filters?.userId) params.userId = filters.userId;
    if (filters?.status) params.status = filters.status;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    
    const response = await this.client.get('/messaging/conversations', { params });
    if (response.data?.data) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  }

  async deleteConversation(id: string) {
    try {
      const response = await this.client.delete(`/messaging/conversations/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 405) {
        throw new Error('این قابلیت در حال حاضر در بک‌اند موجود نیست');
      }
      throw error;
    }
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

  // Quotes management
  async createQuote(data: {
    projectId: string;
    price: number;
    description?: string;
    deliveryTimeDays?: number;
  }) {
    const response = await this.client.post('/quotes', data);
    return response.data;
  }

  async getQuotesForProject(projectId: string) {
    const response = await this.client.get(`/quotes/project/${projectId}`);
    return response.data;
  }

  async getMyQuotes() {
    const response = await this.client.get('/quotes/supplier/my-quotes');
    return response.data;
  }

  async getQuote(quoteId: string) {
    const response = await this.client.get(`/quotes/${quoteId}`);
    return response.data;
  }

  async updateQuote(quoteId: string, data: {
    price?: number;
    description?: string;
    deliveryTimeDays?: number;
  }) {
    const response = await this.client.put(`/quotes/${quoteId}`, data);
    return response.data;
  }

  async acceptQuote(quoteId: string) {
    const response = await this.client.post(`/quotes/${quoteId}/accept`);
    return response.data;
  }

  async rejectQuote(quoteId: string) {
    const response = await this.client.post(`/quotes/${quoteId}/reject`);
    return response.data;
  }

  async withdrawQuote(quoteId: string) {
    const response = await this.client.post(`/quotes/${quoteId}/withdraw`);
    return response.data;
  }

  async deleteQuote(quoteId: string) {
    const response = await this.client.delete(`/quotes/${quoteId}`);
    return response.data;
  }

  async getQuoteStats(projectId: string) {
    const response = await this.client.get(`/quotes/project/${projectId}/stats`);
    return response.data;
  }

  // Invoice endpoints
  async createInvoice(projectId: string, quoteId: string, notes?: string) {
    const response = await this.client.post('/invoices', {
      projectId,
      quoteId,
      notes,
    });
    return response.data;
  }

  async getInvoice(invoiceId: string) {
    const response = await this.client.get(`/invoices/${invoiceId}`);
    return response.data;
  }

  async getMyInvoices() {
    const response = await this.client.get('/invoices/my-invoices');
    return response.data;
  }

  async getSupplierInvoices() {
    try {
      const response = await this.client.get('/invoices/supplier');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return this.getMyInvoices();
      }
      throw error;
    }
  }

  async getCustomerInvoices() {
    try {
      const response = await this.client.get('/invoices/customer');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return this.getMyInvoices();
      }
      throw error;
    }
  }

  async downloadInvoice(invoiceId: string) {
    const response = await this.client.get(`/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getInvoiceStats() {
    const response = await this.client.get('/invoices/stats');
    return response.data;
  }

  // Admin Analytics
  async getAdminAnalytics(startDate?: string, endDate?: string) {
    const response = await this.client.get('/admin/analytics', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  // Admin Quotes Management
  async getAllQuotes(filters?: {
    status?: string;
    projectId?: string;
    supplierId?: string;
    page?: number;
    limit?: number;
  }) {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.projectId) params.projectId = filters.projectId;
    if (filters?.supplierId) params.supplierId = filters.supplierId;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    
    const response = await this.client.get('/quotes', { params });
    if (response.data?.data) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  }

  // Admin Ratings Management
  async getAllRatings(filters?: {
    minScore?: number;
    maxScore?: number;
    page?: number;
    limit?: number;
  }) {
    const params: any = {};
    if (filters?.minScore !== undefined) params.minScore = filters.minScore;
    if (filters?.maxScore !== undefined) params.maxScore = filters.maxScore;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    
    const response = await this.client.get('/rating/all', { params });
    if (response.data?.data) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  }

  async recalculateRating(supplierId: string) {
    const response = await this.client.post(`/rating/recalculate/${supplierId}`);
    return response.data;
  }

  async recalculateAllRatings() {
    const response = await this.client.post('/rating/recalculate-all');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
export default apiClient;

