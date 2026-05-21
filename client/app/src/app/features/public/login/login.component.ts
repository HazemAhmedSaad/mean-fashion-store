import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  phone = '';
  password = '';
  rememberMe = true;
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    this.errorMessage = '';

    if (!this.phone.trim() || !this.password) {
      this.errorMessage = 'Please enter your phone number and password.';
      return;
    }

    this.isSubmitting = true;
    this.authService.login({
      phone: this.normalizePhone(this.phone),
      password: this.password,
    }).subscribe({
      next: (res) => {
        this.authService.setToken(res.token);
        const destination = this.authService.isAdmin() ? '/admin' : '/home';
        this.router.navigate([destination]);
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err);
        this.isSubmitting = false;
      },
    });
  }

  continueAsGuest(): void {
    this.router.navigate(['/home']);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('20') && digits.length === 12) {
      return `0${digits.slice(2)}`;
    }
    return digits;
  }

  private getErrorMessage(error: any): string {
    return error?.error?.message || error?.error?.error || 'Sign in failed. Please try again.';
  }
}
