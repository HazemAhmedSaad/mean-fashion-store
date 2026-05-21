import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartService } from '../../../core/services/cart.service';
import { Cart, ProductItem } from '../../../core/models/cart.interface';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isLoading: boolean = true;
  private cartSub!: Subscription;

  FREE_SHIPPING_THRESHOLD = 500;
  SHIPPING_COST = 50; // Example fixed shipping cost

  constructor(
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Explicitly request cart to make sure API/local is initialized if not yet done
    this.cartService.getMyCart().subscribe({
      next: () => {},
      error: (err) => console.error('Failed to init cart in view', err)
    });

    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
  }

  get totalItems(): number {
    if (!this.cart || !this.cart.items) return 0;
    return this.cart.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  get subtotal(): number {
    if (!this.cart) return 0;
    return this.cart.totalPrice;
  }

  get shippingCost(): number {
    if (this.subtotal === 0) return 0;
    return this.subtotal >= this.FREE_SHIPPING_THRESHOLD ? 0 : this.SHIPPING_COST;
  }

  get estimatedTax(): number {
    return 0; // Tax calculation placeholder
  }

  get total(): number {
    return this.subtotal + this.shippingCost + this.estimatedTax;
  }

  get amountToFreeShipping(): number {
    const diff = this.FREE_SHIPPING_THRESHOLD - this.subtotal;
    return diff > 0 ? diff : 0;
  }

  incrementQuantity(item: ProductItem): void {
    // Optimistic UI update could be done here, but let the service handle it
    this.cartService.updateItem(item._id, { quantity: item.quantity + 1 }, item.productId._id).subscribe({
      next: () => this.cdr.markForCheck(),
      error: (err) => console.error('Update failed', err)
    });
  }

  decrementQuantity(item: ProductItem): void {
    if (item.quantity <= 1) return;
    this.cartService.updateItem(item._id, { quantity: item.quantity - 1 }, item.productId._id).subscribe({
      next: () => this.cdr.markForCheck(),
      error: (err) => console.error('Update failed', err)
    });
  }

  removeItem(item: ProductItem): void {
    this.cartService.deleteItem(item._id, item.productId._id).subscribe({
      next: () => this.cdr.markForCheck(),
      error: (err) => console.error('Delete failed', err)
    });
  }

  getProductImage(item: ProductItem): string {
    const images = item.productId.images;
    if (images && images.length > 0) {
      const url = images[0];
      if (url.startsWith('/uploads')) {
        return `http://localhost:8000${url}`;
      }
      return url;
    }
    return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop';
  }
}
