import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  isOpen = false;

  links = [
    { label: 'Dashboard', icon: 'fa-table-cells-large', route: '/admin' },
    { label: 'Products', icon: 'fa-cube', route: '/admin/products-control', badge: '342' },
    { label: 'Categories', icon: 'fa-table-cells', route: '/admin/categories-control' },
    { label: 'Sub-Categories', icon: 'fa-layer-group', route: '/admin/sub-categories-control' },
    { label: 'Orders', icon: 'fa-cart-shopping', route: '/admin/orders-control', badge: '12', warn: true },
    { label: 'Users', icon: 'fa-users', route: '/admin/users-control' },
    { label: 'Testimonials', icon: 'fa-message', route: '/admin/testimonials-control' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
