import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { OrderService } from '../../../core/services/order.service';
import { User, UserRole } from '../../../core/models/user.interface';
import { Order } from '../../../core/models/order.interface';
import { Pagination } from '../../../core/models/pagination.interface';

@Component({
  selector: 'app-user-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-control.component.html',
  styleUrl: './user-control.component.css'
})
export class UserControlComponent implements OnInit {
  users: User[] = [];
  pagination: Pagination | null = null;
  totalUsers: number = 0;

  // Drawer state
  isDrawerOpen: boolean = false;
  selectedUser: User | null = null;
  activeTab: 'Orders' | 'Addresses' | 'Settings' = 'Orders';
  
  // Drawer update state
  drawerUpdateRole: UserRole = 'user';
  drawerUpdateIsActive: boolean = true;
  userOrders: Order[] = [];

  // Filters
  searchQuery: string = '';
  currentPage: number = 1;
  limit: number = 8;

  constructor(
    private userService: UserService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const params: Record<string, string> = {
      page: this.currentPage.toString(),
      limit: this.limit.toString()
    };
    
    // For now we'll pass the search query as 'name'. If backend supports 'search' generic param, 
    // it could be updated later. The instruction is to pass search. Let's use 'search'.
    if (this.searchQuery.trim()) {
      params['search'] = this.searchQuery.trim();
    }

    this.userService.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.users = res.data;
          this.pagination = res.pagination;
          this.totalUsers = res.pagination?.totalDocuments || res.results || 0;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  openDrawer(user: User): void {
    this.selectedUser = user;
    this.drawerUpdateRole = user.role;
    this.drawerUpdateIsActive = !user.isBlocked;
    this.activeTab = 'Settings'; // Default to settings for now, user can click orders
    this.isDrawerOpen = true;
    
    // Load user orders
    this.userOrders = [];
    this.orderService.getAll({ user: user._id, limit: '5' }).subscribe({
      next: (res) => {
        if (res.success) {
          this.userOrders = res.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load user orders', err);
        this.cdr.detectChanges();
      }
    });
    this.cdr.detectChanges();
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedUser = null;
    this.cdr.detectChanges();
  }

  setTab(tab: 'Orders' | 'Addresses' | 'Settings'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  updateUserStatus(): void {
    if (!this.selectedUser) return;
    
    const updates = {
      role: this.drawerUpdateRole,
      isBlocked: !this.drawerUpdateIsActive
    };

    this.userService.updateUser(this.selectedUser._id, updates).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedUser!.role = this.drawerUpdateRole;
          this.selectedUser!.isBlocked = !this.drawerUpdateIsActive;
          
          const index = this.users.findIndex(u => u._id === this.selectedUser!._id);
          if (index !== -1) {
            this.users[index].role = this.drawerUpdateRole;
            this.users[index].isBlocked = !this.drawerUpdateIsActive;
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to update user', err);
        this.cdr.detectChanges();
      }
    });
  }

  resetPassword(): void {
    // Typically admin has a specific endpoint for this or it sends an email
    alert(`Reset password link sent to ${this.selectedUser?.email || 'user'}`);
  }

  deleteAccount(): void {
    if (!this.selectedUser || !confirm('Are you sure you want to delete this account?')) return;
    // Call delete API if exists for admin, currently we don't have delete user in admin routes
    alert('Delete functionality not available in this demo');
  }

  changePage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) return;
    this.currentPage = page;
    this.loadUsers();
  }
  
  getPageArray(): number[] {
    if (!this.pagination) return [1];
    
    const total = this.pagination.totalPages;
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, this.currentPage + 2);
    
    if (start === 1) {
      end = 5;
    }
    if (end === total) {
      start = total - 4;
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  }
  
  getOrderStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'preparing': return 'badge-info';
      case 'shipped': return 'badge-primary';
      case 'delivered': return 'badge-success';
      case 'canceled_by_user': 
      case 'canceled_by_admin':
      case 'refused': return 'badge-danger';
      default: return 'badge-default';
    }
  }

  getOrderStatusDisplay(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'refused': return 'Rejected';
      case 'canceled_by_user': 
      case 'canceled_by_admin': return 'Canceled';
      default: return status;
    }
  }
}
