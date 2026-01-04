export interface Category {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  order?: number;
  level?: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  title: string;
  slug?: string;
  description?: string;
  icon?: File;
  metaTitle?: string;
  metaDescription?: string;
  parentId?: string;
  order?: number;
}

export interface UpdateCategoryData {
  title?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  icon?: File;
  metaTitle?: string;
  metaDescription?: string;
  parentId?: string | null;
  order?: number;
}

