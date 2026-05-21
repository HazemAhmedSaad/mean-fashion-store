import { Address } from "./address.interface"
import { Pagination } from "./pagination.interface";
export type UserRole = 'user' | 'admin';

export interface UserResponse {
  success: boolean
  results: number
  pagination: Pagination
  data: User[]
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | null;
  role: UserRole;
  addresses?: Address[];
  isBlocked?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponseSingle {
  success: boolean
  data: User
}

export interface UpdateMeRequest {
  name?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}



export interface UpdateAddressRequest {
  label?: 'home' | 'work' | 'other';
  city?: string;
  street?: string;
  building?: string;
  notes?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export interface AdminUpdateUserRequest {
  role?: 'user' | 'admin';
  isBlocked?: boolean;
}