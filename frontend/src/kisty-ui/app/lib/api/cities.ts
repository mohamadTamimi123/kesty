import { BaseApiClient } from './base';

export class CitiesApi extends BaseApiClient {
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
    logo?: File;
    isActive?: boolean;
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
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    if (data.isActive !== undefined) {
      formData.append('isActive', data.isActive.toString());
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

  async getCityById(id: string) {
    const response = await this.client.get(`/admin/cities/${id}`);
    return response.data;
  }

  async getCityBySlug(slug: string) {
    const response = await this.client.get(`/cities/${slug}`);
    return response.data;
  }

  async getActiveCities() {
    const response = await this.client.get('/cities');
    return response.data;
  }

  async getCityStats(slug: string) {
    const response = await this.client.get(`/cities/${slug}/stats`);
    return response.data;
  }

  async getCityTopSuppliers(slug: string, limit?: number) {
    const response = await this.client.get(`/cities/${slug}/top-suppliers`, {
      params: limit ? { limit } : {},
    });
    return response.data;
  }

  async getCityLatestSuppliers(slug: string, limit?: number) {
    const response = await this.client.get(`/cities/${slug}/latest-suppliers`, {
      params: limit ? { limit } : {},
    });
    return response.data;
  }

  async getCityCategories(slug: string) {
    const response = await this.client.get(`/cities/${slug}/categories`);
    return response.data;
  }

  async getCityCategorySuppliers(
    citySlug: string,
    categorySlug: string,
    filters?: {
      subcategory?: string;
      minRating?: number;
      equipment?: string[];
      establishedYear?: number;
    },
  ) {
    const response = await this.client.get(
      `/cities/${citySlug}/categories/${categorySlug}/suppliers`,
      {
        params: filters || {},
      },
    );
    return response.data;
  }

  async getCityCategoryStats(citySlug: string, categorySlug: string) {
    const response = await this.client.get(
      `/cities/${citySlug}/categories/${categorySlug}/stats`,
    );
    return response.data;
  }

  async addCityToSupplier(cityId: string, supplierId: string) {
    const response = await this.client.post(`/cities/${cityId}/suppliers/${supplierId}`);
    return response.data;
  }

  async removeCityFromSupplier(cityId: string, supplierId: string) {
    await this.client.delete(`/cities/${cityId}/suppliers/${supplierId}`);
  }

  async getSupplierCities(supplierId: string) {
    const response = await this.client.get(`/cities/suppliers/${supplierId}`);
    return response.data.cities || [];
  }
}

