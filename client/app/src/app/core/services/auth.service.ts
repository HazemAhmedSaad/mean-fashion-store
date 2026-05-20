import { Injectable } from '@angular/core';

interface JwtPayload {
  role?: string;
  exp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';

  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem(this.TOKEN_KEY, token);
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