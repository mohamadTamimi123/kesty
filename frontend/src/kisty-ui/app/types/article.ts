export interface EducationalArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  categoryId: string | null;
  category?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  subCategoryId: string | null;
  subCategory?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  authorId: string;
  author?: {
    id: string;
    name: string;
  };
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEducationalArticleData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  categoryId?: string;
  subCategoryId?: string;
  authorId: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

export interface UpdateEducationalArticleData {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  categoryId?: string;
  subCategoryId?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
  viewCount?: number;
}

