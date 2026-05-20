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