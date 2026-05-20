import { Pagination } from "./pagination.interface"
export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'refused'
  | 'canceled_by_user'
  | 'canceled_by_admin';

export interface OrderResponse {
  success: boolean
  results: number
  pagination: Pagination
  data: Order[]
}


export interface Order {
  shippingAddress: ShippingAddress
  _id: string
  userId: UserId
  items: OrderItem[]
  totalPrice: number
  status: OrderStatus
  orderDate: string
  createdAt?: string
  updatedAt?: string
}

export interface ShippingAddress {
  addressText: string
  phone: string
}

export interface UserId {
  _id: string
  name: string
  phone: string
  email: string
}

export interface OrderItem {
  _id?: string;
  productId: ProductId ;
  quantity: number;
  priceAtOrderTime: number;
}
export interface ProductId {
  _id: string
  name: string
  slug: string
  price: number
  images: string[]
}

export interface singleOrderResponse {
  success: boolean
  data: Order
}