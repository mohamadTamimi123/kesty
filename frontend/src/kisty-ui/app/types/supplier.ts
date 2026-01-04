export interface Supplier {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  workshopName?: string;
  workshopAddress?: string;
  workshopPhone?: string;
  city?: string | { id: string; title: string };
  avatarUrl?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  slug?: string;
  rating?: number;
  metadata?: {
    specialties?: string;
    experience?: string;
  };
  role?: string;
}

