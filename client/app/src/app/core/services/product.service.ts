import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ProductResponse,
  singleProductResponse,
} from '../models/product.interface';

interface MessageResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly API_URL = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // GET /products — Get all products (public, supports query params for filter/sort/paginate)
  getAll(params?: Record<string, string>): Observable<ProductResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<ProductResponse>(this.API_URL, { params: httpParams });
  }

  // GET /products/slug/:slug — Get single product by slug (public)
  getBySlug(slug: string): Observable<singleProductResponse> {
    return this.http.get<singleProductResponse>(`${this.API_URL}/slug/${slug}`);
  }

  // GET /products/:id — Get single product by ID (public)
  getById(id: string): Observable<singleProductResponse> {
    return this.http.get<singleProductResponse>(`${this.API_URL}/${id}`);
  }

  // POST /products — Create product with images (admin only)
  create(formData: FormData): Observable<singleProductResponse> {
    return this.http.post<singleProductResponse>(this.API_URL, formData);
  }

  // PATCH /products/:id — Update product with optional images (admin only)
  update(id: string, formData: FormData): Observable<singleProductResponse> {
    return this.http.patch<singleProductResponse>(`${this.API_URL}/${id}`, formData);
  }

  // DELETE /products/:id — Soft delete product (admin only)
  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API_URL}/${id}`);
  }
}
