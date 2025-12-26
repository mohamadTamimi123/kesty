export enum ProjectStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum QuantityEstimate {
  LESS_THAN_10 = 'LESS_THAN_10',
  BETWEEN_10_100 = 'BETWEEN_10_100',
  MORE_THAN_100 = 'MORE_THAN_100',
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  customerId: string;
  cityId: string;
  categoryId: string;
  quantityEstimate: QuantityEstimate | null;
  status: ProjectStatus;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
  };
  city?: {
    id: string;
    title: string;
    slug: string;
  };
  category?: {
    id: string;
    title: string;
    slug: string;
  };
  files?: ProjectFile[];
}

export interface CreateProjectData {
  title: string;
  description: string;
  cityId: string;
  categoryId: string;
  quantityEstimate?: QuantityEstimate;
  isPublic?: boolean;
  files?: File[];
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  quantityEstimate?: QuantityEstimate;
  status?: ProjectStatus;
  isPublic?: boolean;
}

