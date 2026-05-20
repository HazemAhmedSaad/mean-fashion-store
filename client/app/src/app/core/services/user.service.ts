import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  User,
  UserResponse,
  UserResponseSingle,
} from '../models/user.interface';
import { Address } from '../models/address.interface';

// ========================
// Request Interfaces
// ========================

export interface UpdateMeRequest {
  name?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AddAddressRequest {
  label?: 'home' | 'work' | 'other';
  city: string;
  street: string;
  building?: string;
  notes?: string;
  phoneNumber: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: 'home' | 'work' | 'other';
  city?: string;
  street?: string;
  building?: string;
  notes?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export interface AdminUpdateUserRequest {
  role?: 'user' | 'admin';
  isBlocked?: boolean;
}

// ========================
// Response Interfaces
// ========================

interface MessageResponse {
  success: boolean;
  message: string;
}

interface AddressListResponse {
  success: boolean;
  data: Address[];
}

interface AddressDeleteResponse {
  success: boolean;
  message: string;
  data: Address[];
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // ============================
  // Current User Routes
  // ============================

  // GET /users/me — Get current user profile (protected)
  getMe(): Observable<UserResponseSingle> {
    return this.http.get<UserResponseSingle>(`${this.API_URL}/me`);
  }

  // PATCH /users/me — Update current user profile (protected)
  updateMe(data: UpdateMeRequest): Observable<UserResponseSingle> {
    return this.http.patch<UserResponseSingle>(`${this.API_URL}/me`, data);
  }

  // DELETE /users/me — Soft delete current user (protected)
  deleteMe(): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API_URL}/me`);
  }

  // PATCH /users/me/password — Change password (protected)
  changePassword(data: ChangePasswordRequest): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.API_URL}/me/password`, data);
  }

  // ============================
  // Address Routes
  // ============================

  // POST /users/addresses — Add new address (protected)
  addAddress(data: AddAddressRequest): Observable<AddressListResponse> {
    return this.http.post<AddressListResponse>(`${this.API_URL}/addresses`, data);
  }

  // PATCH /users/addresses/:id — Update address (protected)
  updateAddress(id: string, data: UpdateAddressRequest): Observable<AddressListResponse> {
    return this.http.patch<AddressListResponse>(`${this.API_URL}/addresses/${id}`, data);
  }

  // DELETE /users/addresses/:id — Delete address (protected)
  deleteAddress(id: string): Observable<AddressDeleteResponse> {
    return this.http.delete<AddressDeleteResponse>(`${this.API_URL}/addresses/${id}`);
  }

  // ============================
  // Admin Routes
  // ============================

  // GET /users — Get all users (admin only)
  getAll(params?: Record<string, string>): Observable<UserResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<UserResponse>(this.API_URL, { params: httpParams });
  }

  // GET /users/blocked — Get blocked users (admin only)
  getBlocked(params?: Record<string, string>): Observable<UserResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<UserResponse>(`${this.API_URL}/blocked`, { params: httpParams });
  }

  // GET /users/deleted — Get deleted users (admin only)
  getDeleted(params?: Record<string, string>): Observable<UserResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<UserResponse>(`${this.API_URL}/deleted`, { params: httpParams });
  }

  // GET /users/:id — Get single user (admin only)
  getById(id: string): Observable<UserResponseSingle> {
    return this.http.get<UserResponseSingle>(`${this.API_URL}/${id}`);
  }

  // PATCH /users/:id — Update user role/block status (admin only)
  updateUser(id: string, data: AdminUpdateUserRequest): Observable<UserResponseSingle> {
    return this.http.patch<UserResponseSingle>(`${this.API_URL}/${id}`, data);
  }
}
