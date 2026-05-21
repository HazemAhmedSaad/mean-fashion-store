import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CategoryResponse,
  Category,
  singleCategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../models/category.interface';
import { MessageResponse } from '../models/cart.interface';


@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly API_URL = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  // GET /categories — Get all categories (public, supports query params)
  getAll(params?: Record<string, string>): Observable<CategoryResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<CategoryResponse>(this.API_URL, { params: httpParams });
  }

  // GET /categories/:id — Get single category (public)
  getById(id: string): Observable<singleCategoryResponse> {
    return this.http.get<singleCategoryResponse>(`${this.API_URL}/${id}`);
  }

  // POST /categories — Create category (admin only)
  create(data: CreateCategoryRequest): Observable<singleCategoryResponse> {
    return this.http.post<singleCategoryResponse>(this.API_URL, data);
  }

  // PATCH /categories/:id — Update category (admin only)
  update(id: string, data: UpdateCategoryRequest): Observable<singleCategoryResponse> {
    return this.http.patch<singleCategoryResponse>(`${this.API_URL}/${id}`, data);
  }

  // DELETE /categories/:id — Soft delete category (admin only)
  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API_URL}/${id}`);
  }
}
