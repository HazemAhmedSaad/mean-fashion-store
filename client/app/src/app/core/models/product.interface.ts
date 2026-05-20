import { Pagination } from "./pagination.interface"

export interface ProductResponse {
    success: boolean
    results: number
    pagination: Pagination
    data: Product[]
}

export interface Product {
    _id: string
    name: string
    slug: string
    description?: string
    price: number
    images?: string[]
    stock: number
    categoryId: string
    subCategoryId: string
    isActive: boolean
    createdAt?: string
    updatedAt?: string
}

export interface singleProductResponse {
    success: boolean
    data: Product
}