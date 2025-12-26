export type UserRole = 'admin' | 'user' | 'supplier';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

