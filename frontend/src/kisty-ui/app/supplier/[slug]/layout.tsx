import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getSupplierData(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const response = await fetch(`${apiUrl}/suppliers/${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await getSupplierData(slug);
  
  if (!supplier) {
    return {
      title: "پروفایل تولیدکننده | کیستی",
      description: "پروفایل تولیدکننده در پلتفرم کیستی",
    };
  }
  
  const title = supplier.workshopName || supplier.fullName || "پروفایل تولیدکننده";
  const description = supplier.bio || `پروفایل ${title} در پلتفرم کیستی`;
  
  return {
    title: `${title} | کیستی`,
    description,
    openGraph: {
      title: `${title} | کیستی`,
      description,
      type: "profile",
      images: supplier.profileImageUrl ? [supplier.profileImageUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | کیستی`,
      description,
    },
  };
}

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

