import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth.interface';

interface JwtPayload {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  exp?: number;
}

export interface SignupRequest {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'token';

  private token: string | null = null;
  public onAuthSuccess$ = new Subject<void>();

  constructor(private http: HttpClient) {
    this.loadToken();
  }

  // ========================
  // API Methods
  // ========================

  signup(data: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/signup`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, data);
  }

  // ========================
  // Token Management
  // ========================

  private loadToken(): void {
    this.token = localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem(this.TOKEN_KEY, token);
    this.onAuthSuccess$.next();
  }

  getToken(): string | null {
    return this.token;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    if (!this.token) return false;

    const payload = this.decodeToken();

    if (!payload?.exp) return false;

    return payload.exp * 1000 > Date.now();
  }

  getRole(): string | null {
    const payload = this.decodeToken();
    return payload?.role || null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  getUserFromToken(): JwtPayload | null {
    return this.decodeToken();
  }

  private decodeToken(): JwtPayload | null {
    try {
      if (!this.token) return null;

      const payload = this.token.split('.')[1];

      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  }
}