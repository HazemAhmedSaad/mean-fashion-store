import { Pagination } from "./pagination.interface"

export interface SubCategoryResponse {
    success: boolean
    results: number
    pagination: Pagination
    data: SubCategory[]
}

export interface SubCategory {
    _id: string
    title: string
    categoryId: CategoryId
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
}

export interface CategoryId {
    _id: string
    title: string
}

export interface singleSubCategoryResponse {
    success: boolean
    data: SubCategory
}
export interface CreateSubCategoryRequest {
    title: string;
    categoryId: string;
    isActive?: boolean;
}

export interface UpdateSubCategoryRequest {
    title?: string;
    categoryId?: string;
    isActive?: boolean;
}