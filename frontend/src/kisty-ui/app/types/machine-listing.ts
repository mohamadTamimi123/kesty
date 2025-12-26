export enum ListingType {
  FOR_SALE = 'for_sale',
  FOR_RENT = 'for_rent',
}

export enum MachineCondition {
  NEW = 'new',
  USED = 'used',
}

export interface MachineListing {
  id: string;
  title: string;
  slug: string;
  supplierProfileId: string;
  supplierProfile?: {
    id: string;
    name: string;
  };
  machineId: string | null;
  machine?: {
    id: string;
    name: string;
  };
  listingType: ListingType;
  price: number | null;
  cityId: string;
  city?: {
    id: string;
    title: string;
    slug: string;
  };
  description: string | null;
  condition: MachineCondition;
  contactPhone: string;
  isActive: boolean;
  isSold: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MachineListingFilters {
  cityId?: string;
  categoryId?: string;
  subCategoryId?: string;
  machineId?: string;
  listingType?: ListingType;
  condition?: MachineCondition;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export interface CreateMachineListingData {
  title: string;
  slug?: string;
  supplierProfileId: string;
  machineId?: string;
  listingType: ListingType;
  price?: number;
  cityId: string;
  description?: string;
  condition?: MachineCondition;
  contactPhone: string;
  isActive?: boolean;
}

export interface UpdateMachineListingData {
  title?: string;
  slug?: string;
  machineId?: string;
  listingType?: ListingType;
  price?: number;
  cityId?: string;
  description?: string;
  condition?: MachineCondition;
  contactPhone?: string;
  isActive?: boolean;
  isSold?: boolean;
  viewCount?: number;
}

