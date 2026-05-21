import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  acceptedTerms = false;
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get passwordStrength(): 'Weak' | 'Medium' | 'Strong' {
    let score = 0;
    if (this.password.length >= 8) score++;
    if (/[A-Z]/.test(this.password) && /[a-z]/.test(this.password)) score++;
    if (/\d/.test(this.password) || /[^A-Za-z0-9]/.test(this.password)) score++;

    if (score >= 3) return 'Strong';
    if (score === 2) return 'Medium';
    return 'Weak';
  }

  get strengthClass(): string {
    return this.passwordStrength.toLowerCase();
  }

  signup(): void {
    this.errorMessage = '';

    if (!this.firstName.trim() || !this.phone.trim() || !this.password) {
      this.errorMessage = 'Name, phone number and password are required.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.acceptedTerms) {
      this.errorMessage = 'Please agree to the terms before creating your account.';
      return;
    }

    const payload = {
      name: `${this.firstName} ${this.lastName}`.trim(),
      phone: this.normalizePhone(this.phone),
      email: this.email.trim() || undefined,
      password: this.password,
    };

    this.isSubmitting = true;
    this.authService.signup(payload).subscribe({
      next: (res) => {
        this.authService.setToken(res.token);
        this.router.navigate(['/home']);
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

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('20') && digits.length === 12) {
      return `0${digits.slice(2)}`;
    }
    return digits;
  }

  private getErrorMessage(error: any): string {
    return error?.error?.message || error?.error?.error || 'Could not create your account. Please try again.';
  }
}
