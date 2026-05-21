import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../core/models/order.interface';
import { Pagination } from '../../../core/models/pagination.interface';

@Component({
  selector: 'app-order-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-control.component.html',
  styleUrl: './order-control.component.css'
})
export class OrderControlComponent implements OnInit {
  orders: Order[] = [];
  pagination: Pagination | null = null;
  totalOrders: number = 0;
  
  // Drawer state
  isDrawerOpen: boolean = false;
  selectedOrder: Order | null = null;
  drawerUpdateStatus: OrderStatus | '' = '';
  
  // Filters
  searchQuery: string = '';
  statusFilter: string = ''; // empty string means 'All Status'
  paymentFilter: string = ''; // empty string means 'Payment Method'
  dateRangeFilter: string = ''; // empty string means 'Date Range'
  
  // Pagination State
  currentPage: number = 1;
  limit: number = 8;
  
  // Mock Summary Stats (Pending, Preparing, Shipped, Delivered, Cancelled, Rejected)
  stats = {
    pending: 87,
    preparing: 134,
    shipped: 210,
    delivered: 782,
    cancelled: 23,
    rejected: 12
  };
  
  statusList = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Refused', value: 'refused' },
    { label: 'Cancelled (User)', value: 'canceled_by_user' },
    { label: 'Cancelled (Admin)', value: 'canceled_by_admin' }
  ];

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const params: Record<string, string> = {
      page: this.currentPage.toString(),
      limit: this.limit.toString()
    };
    
    if (this.statusFilter) {
      params['status'] = this.statusFilter;
    }
    if (this.searchQuery) {
      params['search'] = this.searchQuery;
    }

    this.orderService.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.orders = res.data;
          this.pagination = res.pagination;
          this.totalOrders = res.pagination?.totalDocuments || res.results || 0;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching orders', err);
        this.cdr.detectChanges();
      }
    });
  }

  openDrawer(order: Order): void {
    this.selectedOrder = order;
    this.drawerUpdateStatus = order.status;
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedOrder = null;
    this.drawerUpdateStatus = '';
  }

  submitStatusUpdate(): void {
    if (!this.selectedOrder || !this.drawerUpdateStatus) return;
    
    this.orderService.updateStatus(this.selectedOrder._id, { status: this.drawerUpdateStatus as OrderStatus }).subscribe({
      next: (res) => {
        if (res.success) {
          // Update local state
          this.selectedOrder!.status = this.drawerUpdateStatus as OrderStatus;
          const index = this.orders.findIndex(o => o._id === this.selectedOrder!._id);
          if (index !== -1) {
            this.orders[index].status = this.drawerUpdateStatus as OrderStatus;
          }
          this.closeDrawer();
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }
  
  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.paymentFilter = '';
    this.dateRangeFilter = '';
    this.onFilterChange();
  }

  changePage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) return;
    this.currentPage = page;
    this.loadOrders();
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
  
  getPaymentMethod(order: Order): string {
    return (order.totalPrice % 2 === 0) ? 'COD' : 'Card'; // Just a stable mock based on price
  }

  getStatusDisplay(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'refused': return 'Rejected';
      case 'canceled_by_user': 
      case 'canceled_by_admin': return 'Cancelled';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'preparing': return 'badge-info';
      case 'shipped': return 'badge-primary';
      case 'delivered': return 'badge-success';
      case 'refused': 
      case 'canceled_by_user':
      case 'canceled_by_admin': return 'badge-danger';
      default: return 'badge-default';
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}

