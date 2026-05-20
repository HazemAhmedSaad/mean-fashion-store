import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  TestimonialsResponse,
  Testimonial,
  singleTestimonialResponse,
} from '../models/testimonial.interface';

export interface CreateTestimonialRequest {
  name: string;
  phone: string;
  comment: string;
  stars?: number;
}

export interface UpdateTestimonialRequest {
  status?: 'pending' | 'approved' | 'rejected';
  isVisible?: boolean;
}

interface MessageResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  private readonly API_URL = `${environment.apiUrl}/testimonials`;

  constructor(private http: HttpClient) {}

  // GET /testimonials — Get visible & approved testimonials (public)
  getVisible(params?: Record<string, string>): Observable<TestimonialsResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<TestimonialsResponse>(this.API_URL, { params: httpParams });
  }

  // POST /testimonials — Submit a new testimonial (public)
  create(data: CreateTestimonialRequest): Observable<singleTestimonialResponse> {
    return this.http.post<singleTestimonialResponse>(this.API_URL, data);
  }

  // GET /testimonials/admin — Get all testimonials (admin only)
  getAll(params?: Record<string, string>): Observable<TestimonialsResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<TestimonialsResponse>(`${this.API_URL}/admin`, { params: httpParams });
  }

  // GET /testimonials/:id — Get single testimonial (admin only)
  getById(id: string): Observable<singleTestimonialResponse> {
    return this.http.get<singleTestimonialResponse>(`${this.API_URL}/${id}`);
  }

  // PATCH /testimonials/:id — Update testimonial status/visibility (admin only)
  update(id: string, data: UpdateTestimonialRequest): Observable<singleTestimonialResponse> {
    return this.http.patch<singleTestimonialResponse>(`${this.API_URL}/${id}`, data);
  }

  // DELETE /testimonials/:id — Hard delete testimonial (admin only)
  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API_URL}/${id}`);
  }
}
