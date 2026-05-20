import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SubCategoryResponse,
  singleSubCategoryResponse,
} from '../models/sub-category.interface';

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

interface MessageResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class SubCategoryService {
  private readonly API_URL = `${environment.apiUrl}/sub-categories`;

  constructor(private http: HttpClient) {}

  // GET /sub-categories — Get all sub-categories (public, supports ?categoryId= filter)
  getAll(params?: Record<string, string>): Observable<SubCategoryResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<SubCategoryResponse>(this.API_URL, { params: httpParams });
  }

  // GET /sub-categories/:id — Get single sub-category (public)
  getById(id: string): Observable<singleSubCategoryResponse> {
    return this.http.get<singleSubCategoryResponse>(`${this.API_URL}/${id}`);
  }

  // POST /sub-categories — Create sub-category (admin only)
  create(data: CreateSubCategoryRequest): Observable<singleSubCategoryResponse> {
    return this.http.post<singleSubCategoryResponse>(this.API_URL, data);
  }

  // PATCH /sub-categories/:id — Update sub-category (admin only)
  update(id: string, data: UpdateSubCategoryRequest): Observable<singleSubCategoryResponse> {
    return this.http.patch<singleSubCategoryResponse>(`${this.API_URL}/${id}`, data);
  }

  // DELETE /sub-categories/:id — Soft delete sub-category (admin only)
  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API_URL}/${id}`);
  }
}
