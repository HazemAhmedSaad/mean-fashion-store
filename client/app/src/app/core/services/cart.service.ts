import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Cart, CartResponse } from '../models/cart.interface';

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

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly API_URL = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) {}

  // GET /cart — Get current user's cart
  getMyCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.API_URL);
  }

  // POST /cart — Add item to cart
  addItem(data: AddToCartRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(this.API_URL, data);
  }

  // PATCH /cart/items/:itemId — Update cart item quantity
  updateItem(itemId: string, data: UpdateCartItemRequest): Observable<CartResponse> {
    return this.http.patch<CartResponse>(`${this.API_URL}/items/${itemId}`, data);
  }

  // DELETE /cart/items/:itemId — Remove single item from cart
  deleteItem(itemId: string): Observable<CartItemDeleteResponse> {
    return this.http.delete<CartItemDeleteResponse>(`${this.API_URL}/items/${itemId}`);
  }

  // DELETE /cart — Clear entire cart
  clearCart(): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(this.API_URL);
  }
}
