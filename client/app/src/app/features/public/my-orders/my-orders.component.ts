import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { Order, OrderStatus } from '../../../core/models/order.interface';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css',
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  errorMessage = '';
  cancellingOrderId: string | null = null;

  private readonly imageBaseUrl = 'http://localhost:8000';

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getMyOrders({ sort: '-orderDate', limit: '50' }).pipe(
      timeout(12000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.name === 'TimeoutError'
          ? 'Orders request timed out. Please check the server and try again.'
          : err?.error?.message || 'Could not load your orders.';
        this.cdr.detectChanges();
      },
    });
  }

  cancelOrder(order: Order): void {
    if (!this.canCancel(order) || this.cancellingOrderId) return;

    this.cancellingOrderId = order._id;
    this.orderService.cancelOrder(order._id).subscribe({
      next: (res) => {
        this.orders = this.orders.map((item) => item._id === order._id ? res.data : item);
        this.cancellingOrderId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'This order can not be canceled now.';
        this.cancellingOrderId = null;
        this.cdr.detectChanges();
      },
    });
  }

  canCancel(order: Order): boolean {
    return ['pending', 'preparing'].includes(order.status);
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      pending: 'Pending',
      preparing: 'Preparing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      refused: 'Refused',
      canceled_by_user: 'Canceled by you',
      canceled_by_admin: 'Canceled by store',
    };
    return labels[status];
  }

  getStatusClass(status: OrderStatus): string {
    if (status === 'delivered') return 'status-delivered';
    if (status === 'shipped') return 'status-shipped';
    if (status === 'preparing') return 'status-preparing';
    if (status === 'pending') return 'status-pending';
    return 'status-canceled';
  }

  isStepActive(order: Order, step: OrderStatus): boolean {
    const orderSteps: OrderStatus[] = ['pending', 'preparing', 'shipped', 'delivered'];
    const currentIndex = orderSteps.indexOf(order.status);
    const stepIndex = orderSteps.indexOf(step);
    return currentIndex >= stepIndex && !order.status.startsWith('canceled') && order.status !== 'refused';
  }

  getProductImage(image?: string): string {
    if (!image) {
      return 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=300&auto=format&fit=crop';
    }
    return image.startsWith('/uploads') ? `${this.imageBaseUrl}${image}` : image;
  }

  getOrderDate(order: Order): string {
    return order.orderDate || order.createdAt || '';
  }

  getItemsCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  trackById(_: number, order: Order): string {
    return order._id;
  }
}
