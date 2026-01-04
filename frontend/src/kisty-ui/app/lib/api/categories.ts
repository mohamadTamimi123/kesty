import { BaseApiClient } from './base';

export class CategoriesApi extends BaseApiClient {
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
    parentId?: string;
    order?: number;
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
    if (data.parentId) {
      formData.append('parentId', data.parentId);
    }
    if (data.order !== undefined) {
      formData.append('order', data.order.toString());
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
    parentId?: string | null;
    order?: number;
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
    if (data.parentId !== undefined) {
      formData.append('parentId', data.parentId || '');
    }
    if (data.order !== undefined) {
      formData.append('order', data.order.toString());
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

  async reorderCategories(categoryIds: string[]) {
    const response = await this.client.put('/admin/categories/reorder', {
      categoryIds,
    });
    return response.data;
  }

  async moveCategory(
    categoryId: string,
    newParentId: string | null,
    newOrder?: number,
  ) {
    const response = await this.client.put(`/admin/categories/${categoryId}/move`, {
      newParentId,
      newOrder,
    });
    return response.data;
  }

  async getCategoryTree() {
    // Use public endpoint instead of admin endpoint
    const response = await this.client.get('/categories/tree');
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

  async getCategoryStats(slug: string) {
    const response = await this.client.get(`/categories/${slug}/stats`);
    return response.data;
  }

  async getCategoryTopSuppliers(slug: string, limit?: number) {
    const response = await this.client.get(`/categories/${slug}/top-suppliers`, {
      params: limit ? { limit } : {},
    });
    return response.data;
  }

  async getCategorySubcategories(slug: string) {
    const response = await this.client.get(`/categories/${slug}/subcategories`);
    return response.data;
  }

  async getCategoryCities(slug: string) {
    const response = await this.client.get(`/categories/${slug}/cities`);
    return response.data;
  }

  async getCategoryArticles(slug: string, limit?: number) {
    const response = await this.client.get(`/categories/${slug}/articles`, {
      params: limit ? { limit } : {},
    });
    return response.data;
  }

  async getCityCategoryStats(citySlug: string, categorySlug: string) {
    const response = await this.client.get(
      `/cities/${citySlug}/categories/${categorySlug}/stats`,
    );
    return response.data;
  }

  async getCategoryTreePublic() {
    const response = await this.client.get('/categories/tree');
    return response.data;
  }

  async addCategoryToSupplier(categoryId: string, supplierId: string) {
    const response = await this.client.post(`/categories/${categoryId}/suppliers/${supplierId}`);
    return response.data;
  }

  async removeCategoryFromSupplier(categoryId: string, supplierId: string) {
    await this.client.delete(`/categories/${categoryId}/suppliers/${supplierId}`);
  }

  async getSupplierCategories(supplierId: string) {
    const response = await this.client.get(`/categories/suppliers/${supplierId}`);
    return response.data.categories || [];
  }
}

