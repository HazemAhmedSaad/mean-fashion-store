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
  export interface AddToCartRequest {
    productId: string;
    quantity?: number;
  }

  export interface UpdateCartItemRequest {
    quantity: number;
  }

  export interface MessageResponse {
    success: boolean;
    message: string;
  }

  export interface CartItemDeleteResponse {
    success: boolean;
    message: string;
    data: Cart;
  }