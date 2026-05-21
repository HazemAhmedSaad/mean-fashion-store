import { Pagination } from "./pagination.interface"

export interface CategoryResponse {
  success: boolean
  results: number
  pagination: Pagination
  data: Category[]
}

export interface Category {
  _id: string
  title: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface singleCategoryResponse {
  success: boolean
  data: Category
}

export interface CreateCategoryRequest {
  title: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  title?: string;
  isActive?: boolean;
}
