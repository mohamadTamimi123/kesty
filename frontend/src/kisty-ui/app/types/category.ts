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
}

export interface UpdateCategoryData {
  title?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  icon?: File;
  metaTitle?: string;
  metaDescription?: string;
}

