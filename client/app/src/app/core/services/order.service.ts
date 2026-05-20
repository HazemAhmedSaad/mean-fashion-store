import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  OrderResponse,
  OrderStatus,
  singleOrderResponse,
} from '../models/order.interface';

export interface CreateOrderRequest {
  addressId?: string;
  shippingAddress?: {
    addressText: string;
    phone: string;
  };
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

interface MessageResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly API_URL = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  // POST /orders — Create order from cart (protected)
  create(data: CreateOrderRequest): Observable<singleOrderResponse> {
    return this.http.post<singleOrderResponse>(this.API_URL, data);
  }

  // GET /orders/my-orders — Get current user's orders (protected)
  getMyOrders(params?: Record<string, string>): Observable<OrderResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<OrderResponse>(`${this.API_URL}/my-orders`, { params: httpParams });
  }

  // GET /orders — Get all orders (admin only)
  getAll(params?: Record<string, string>): Observable<OrderResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<OrderResponse>(this.API_URL, { params: httpParams });
  }

  // GET /orders/:id — Get single order (protected, user sees own, admin sees all)
  getById(id: string): Observable<singleOrderResponse> {
    return this.http.get<singleOrderResponse>(`${this.API_URL}/${id}`);
  }

  // PATCH /orders/:id/cancel — Cancel own order (protected, only pending/preparing)
  cancelOrder(id: string): Observable<singleOrderResponse> {
    return this.http.patch<singleOrderResponse>(`${this.API_URL}/${id}/cancel`, {});
  }

  // PATCH /orders/:id/status — Update order status (admin only)
  updateStatus(id: string, data: UpdateOrderStatusRequest): Observable<singleOrderResponse> {
    return this.http.patch<singleOrderResponse>(`${this.API_URL}/${id}/status`, data);
  }

  // DELETE /orders/:id — Soft delete order (admin only)
  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API_URL}/${id}`);
  }
}
