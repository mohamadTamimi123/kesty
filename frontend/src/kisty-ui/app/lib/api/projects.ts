import { BaseApiClient } from './base';
import { Project } from '../../types/project';

export class ProjectsApi extends BaseApiClient {
  async createProject(data: {
    title: string;
    description: string;
    cityId: string;
    categoryId: string;
    subCategoryId?: string;
    machineId?: string;
    quantityEstimate?: string;
    isPublic?: boolean;
    files?: File[];
  }) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('cityId', data.cityId);
    formData.append('categoryId', data.categoryId);
    if (data.subCategoryId) {
      formData.append('subCategoryId', data.subCategoryId);
    }
    if (data.machineId) {
      formData.append('machineId', data.machineId);
    }
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

  async getPublicProjects(page: number = 1, limit: number = 50) {
    const response = await this.client.get('/projects/public', {
      params: { page, limit },
    });
    return response.data;
  }

  async getRelevantProjectsForSupplier(
    categoryIds: string[] = [],
    cityIds: string[] = [],
    subCategoryIds: string[] = [],
    limit: number = 10,
    page: number = 1,
    cursor?: string,
  ): Promise<{ data: Project[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean } | Project[]> {
    const params: Record<string, string> = {};
    if (categoryIds.length > 0) {
      params.categoryIds = categoryIds.join(',');
    }
    if (cityIds.length > 0) {
      params.cityIds = cityIds.join(',');
    }
    if (subCategoryIds.length > 0) {
      params.subCategoryIds = subCategoryIds.join(',');
    }
    if (limit !== 10) {
      params.limit = limit.toString();
    }
    if (page !== 1) {
      params.page = page.toString();
    }
    if (cursor) {
      params.cursor = cursor;
    }

    try {
      const response = await this.client.get('/projects/relevant-for-supplier', {
        params,
      });
      
      // Handle both paginated response and legacy array response
      // BaseApiClient.get() already returns response.data, so response is the actual data
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        // Paginated response: { data: Project[], total: number, ... }
        return response;
      }
      // Legacy array response or empty response
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      // Log error details for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching relevant projects:', {
          error: error?.message || error,
          errorResponse: error?.response?.data,
          statusCode: error?.response?.status,
          categoryIds,
          cityIds,
          subCategoryIds,
          limit,
          page,
          cursor,
        });
      }
      // Re-throw to let ErrorContext handle it
      throw error;
    }
  }

  async getProjectById(id: string) {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async getProjectsBatch(ids: string[]): Promise<Project[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const response = await this.client.post('/projects/batch', { ids });
    return Array.isArray(response.data) ? response.data : [];
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

  async getRelevantSuppliers(projectId: string) {
    const response = await this.client.get(`/project-distribution/${projectId}/relevant-suppliers`);
    return response.data;
  }

  async getExcludedSuppliers(projectId: string) {
    const response = await this.client.get(`/project-distribution/${projectId}/excluded-suppliers`);
    return response.data;
  }
}

