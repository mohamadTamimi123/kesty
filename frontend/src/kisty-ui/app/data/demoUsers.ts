import { User } from '../types/user';

export const demoUsers: User[] = [
  {
    id: '1',
    name: 'علی احمدی',
    phone: '09123456789',
    email: 'ali.ahmadi@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:20:00Z',
  },
  {
    id: '2',
    name: 'مریم رضایی',
    phone: '09123456790',
    email: 'maryam.rezaei@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-02-10T09:15:00Z',
  },
  {
    id: '3',
    name: 'حسین کریمی',
    phone: '09123456791',
    email: 'hossein.karimi@example.com',
    role: 'supplier',
    status: 'active',
    createdAt: '2024-02-20T11:45:00Z',
    updatedAt: '2024-02-25T16:30:00Z',
  },
  {
    id: '4',
    name: 'فاطمه محمدی',
    phone: '09123456792',
    email: 'fateme.mohammadi@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: '2024-03-05T08:20:00Z',
  },
  {
    id: '5',
    name: 'رضا نوری',
    phone: '09123456793',
    email: 'reza.nouri@example.com',
    role: 'supplier',
    status: 'active',
    createdAt: '2024-03-12T13:10:00Z',
  },
  {
    id: '6',
    name: 'زهرا صادقی',
    phone: '09123456794',
    email: 'zahra.sadeghi@example.com',
    role: 'user',
    status: 'blocked',
    createdAt: '2024-03-18T15:30:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
  },
  {
    id: '7',
    name: 'محمد حسینی',
    phone: '09123456795',
    email: 'mohammad.hosseini@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-03-25T12:00:00Z',
  },
  {
    id: '8',
    name: 'سارا علی‌زاده',
    phone: '09123456796',
    email: 'sara.alizadeh@example.com',
    role: 'supplier',
    status: 'active',
    createdAt: '2024-04-01T09:45:00Z',
  },
  {
    id: '9',
    name: 'امیر رضوی',
    phone: '09123456797',
    email: 'amir.rezavi@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: '2024-04-08T14:20:00Z',
  },
  {
    id: '10',
    name: 'نرگس فرهادی',
    phone: '09123456798',
    email: 'narges.farahadi@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-04-15T11:30:00Z',
  },
  {
    id: '11',
    name: 'حامد موسوی',
    phone: '09123456799',
    email: 'hamed.mousavi@example.com',
    role: 'supplier',
    status: 'active',
    createdAt: '2024-04-22T16:15:00Z',
    updatedAt: '2024-04-25T10:30:00Z',
  },
  {
    id: '12',
    name: 'لیلا اکبری',
    phone: '09123456800',
    email: 'leila.akbari@example.com',
    role: 'user',
    status: 'blocked',
    createdAt: '2024-04-28T13:45:00Z',
  },
  {
    id: '13',
    name: 'داوود قاسمی',
    phone: '09123456801',
    email: 'davood.ghasemi@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-05-05T10:00:00Z',
  },
  {
    id: '14',
    name: 'مینا طاهری',
    phone: '09123456802',
    email: 'mina.taheri@example.com',
    role: 'supplier',
    status: 'inactive',
    createdAt: '2024-05-12T15:20:00Z',
  },
  {
    id: '15',
    name: 'کامران یوسفی',
    phone: '09123456803',
    email: 'kamran.yousefi@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-05-20T12:30:00Z',
  },
];

// Helper function to get user by ID
export const getUserById = (id: string): User | undefined => {
  return demoUsers.find(user => user.id === id);
};

// Helper function to format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Helper function to get role label in Persian
export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: 'مدیر',
    user: 'کاربر',
    supplier: 'تولیدکننده',
  };
  return labels[role] || role;
};

// Helper function to get status label in Persian
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'فعال',
    inactive: 'غیرفعال',
    blocked: 'مسدود',
  };
  return labels[status] || status;
};

