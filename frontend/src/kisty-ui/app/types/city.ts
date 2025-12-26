export interface City {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCityData {
  title: string;
  slug?: string;
  description?: string;
  logo?: File;
}

export interface UpdateCityData {
  title?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  logo?: File;
}

