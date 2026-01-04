/**
 * Profile utility functions
 */

export interface ProfileData {
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  workshopName?: string;
  workshopAddress?: string;
  workshopPhone?: string;
  bio?: string;
  specialties?: string;
  experience?: string;
  profileImageUrl?: string;
  metadata?: {
    specialties?: string;
    experience?: string;
  };
}

/**
 * Calculates profile completion percentage according to Kisty documentation
 * 
 * Breakdown:
 * - Portfolio/Gallery: 40% (minimum 3 complete projects)
 * - Basic Workshop Info: 25% (name, city, phone, address)
 * - Profile & Cover Images: 15% (quality images)
 * - Machine List: 12% (minimum 3 devices)
 * - Materials: 8% (selected raw materials)
 */
export interface ProfileCompletionData extends ProfileData {
  portfolioCount?: number; // Number of complete portfolios
  hasProfileImage?: boolean;
  hasCoverImage?: boolean;
  machineCount?: number; // Number of machines
  materialCount?: number; // Number of materials
}

export const calculateProfileCompletion = (
  profile: ProfileCompletionData | null,
  additionalData?: {
    portfolioCount?: number;
    hasProfileImage?: boolean;
    hasCoverImage?: boolean;
    machineCount?: number;
    materialCount?: number;
  }
): number => {
  if (!profile) return 0;

  // Portfolio/Gallery: 40% (minimum 3 complete projects)
  const portfolioCount = additionalData?.portfolioCount || profile.portfolioCount || 0;
  const portfolioScore = Math.min(portfolioCount / 3, 1) * 40;

  // Basic Workshop Info: 25% (name, city, phone, address)
  const basicInfoFields = [
    profile.workshopName || profile.fullName || profile.name,
    profile.city,
    profile.phone || profile.workshopPhone,
    profile.workshopAddress || profile.address,
  ];
  const basicInfoCount = basicInfoFields.filter((field) => field && field.trim() !== '').length;
  const basicInfoScore = (basicInfoCount / 4) * 25;

  // Profile & Cover Images: 15% (quality images)
  const hasProfileImage = additionalData?.hasProfileImage !== undefined 
    ? additionalData.hasProfileImage 
    : !!profile.profileImageUrl;
  const hasCoverImage = additionalData?.hasCoverImage !== undefined 
    ? additionalData.hasCoverImage 
    : false; // Cover image not in current profile data
  const imageScore = ((hasProfileImage ? 1 : 0) + (hasCoverImage ? 1 : 0)) / 2 * 15;

  // Machine List: 12% (minimum 3 devices)
  const machineCount = additionalData?.machineCount || profile.machineCount || 0;
  const machineScore = Math.min(machineCount / 3, 1) * 12;

  // Materials: 8% (selected raw materials)
  const materialCount = additionalData?.materialCount || profile.materialCount || 0;
  const materialScore = Math.min(materialCount / 1, 1) * 8; // At least 1 material

  const totalScore = Math.round(
    portfolioScore + 
    basicInfoScore + 
    imageScore + 
    machineScore + 
    materialScore
  );

  return Math.min(100, Math.max(0, totalScore));
};

