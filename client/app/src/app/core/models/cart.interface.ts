export interface CartResponse {
    success: boolean
    data: Cart
}

export interface Cart {
    _id: string
    userId: string
    items: ProductItem[]
    totalPrice: number
    createdAt: string
    updatedAt: string
}

export interface ProductItem {
    productId: ProductId
    quantity: number
    priceAtAddition: number
    isPriceChanged: boolean
    _id: string
}

export interface ProductId {
    _id: string
    name: string
    slug: string
    price: number
    images: string[]
    stock: number
    isActive?: boolean
}
