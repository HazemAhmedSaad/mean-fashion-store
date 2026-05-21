import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AddToCartRequest, Cart, CartItemDeleteResponse, CartResponse, MessageResponse, ProductItem, UpdateCartItemRequest } from '../models/cart.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly API_URL = `${environment.apiUrl}/cart`;
  private readonly LOCAL_CART_KEY = 'maison_local_cart';

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.initCart();
    
    // Listen for login/signup success to sync the local cart
    this.authService.onAuthSuccess$.subscribe(() => {
      this.syncLocalCartToApi();
    });
  }

  // Initialize cart state on startup
  private initCart(): void {
    if (this.authService.isAuthenticated()) {
      this.http.get<CartResponse>(this.API_URL).subscribe({
        next: (res) => this.updateState(res.data),
        error: () => this.updateState(this.getEmptyCart())
      });
    } else {
      const localCart = this.getLocalCart();
      this.updateState(localCart);
    }
  }

  private updateState(cart: Cart): void {
    this.cartSubject.next(cart);
    const count = cart.items ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
    this.cartCountSubject.next(count);
  }

  // Generate an empty cart object structure
  private getEmptyCart(): Cart {
    return {
      _id: 'local',
      userId: 'local',
      items: [],
      totalPrice: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // ========================
  // LOCAL STORAGE METHODS
  // ========================

  private getLocalCart(): Cart {
    const saved = localStorage.getItem(this.LOCAL_CART_KEY);
    return saved ? JSON.parse(saved) : this.getEmptyCart();
  }

  private saveLocalCart(cart: Cart): void {
    // Recalculate total price
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.priceAtAddition * item.quantity), 0);
    localStorage.setItem(this.LOCAL_CART_KEY, JSON.stringify(cart));
    this.updateState(cart);
  }

  // ========================
  // API & HYBRID METHODS
  // ========================

  getMyCart(): Observable<CartResponse> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: true, data: this.getLocalCart() });
    }
    return this.http.get<CartResponse>(this.API_URL).pipe(
      tap(res => this.updateState(res.data))
    );
  }

  // Important: for local storage to work beautifully, we should pass product details.
  // We'll accept AddToCartRequest, but also optional product metadata for local caching.
  addItem(data: AddToCartRequest, productMeta?: { name: string, price: number, slug: string, images: string[], stock: number }): Observable<CartResponse> {
    if (!this.authService.isAuthenticated()) {
      const cart = this.getLocalCart();
      const existingItemIndex = cart.items.findIndex(i => i.productId._id === data.productId);
      
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += (data.quantity || 1);
      } else if (productMeta) {
        cart.items.push({
          _id: 'local_' + Date.now(),
          productId: {
            _id: data.productId,
            name: productMeta.name,
            slug: productMeta.slug,
            price: productMeta.price,
            images: productMeta.images,
            stock: productMeta.stock,
            isActive: true
          },
          quantity: data.quantity || 1,
          priceAtAddition: productMeta.price,
          isPriceChanged: false
        });
      }
      this.saveLocalCart(cart);
      return of({ success: true, data: cart });
    }

    return this.http.post<CartResponse>(this.API_URL, data).pipe(
      tap(res => {
        // Optimistically reload cart entirely to be safe, or just use the returned populated cart if the API returns it populated.
        // The API returns the updated cart.
        this.updateState(res.data);
      })
    );
  }

  updateItem(itemId: string, data: UpdateCartItemRequest, productIdForLocalFallback?: string): Observable<CartResponse> {
    if (!this.authService.isAuthenticated()) {
      const cart = this.getLocalCart();
      // If we use local id or product id
      const index = cart.items.findIndex(i => i._id === itemId || i.productId._id === productIdForLocalFallback);
      if (index > -1) {
        cart.items[index].quantity = data.quantity;
        this.saveLocalCart(cart);
      }
      return of({ success: true, data: cart });
    }

    return this.http.patch<CartResponse>(`${this.API_URL}/items/${itemId}`, data).pipe(
      tap(res => this.updateState(res.data))
    );
  }

  deleteItem(itemId: string, productIdForLocalFallback?: string): Observable<CartItemDeleteResponse> {
    if (!this.authService.isAuthenticated()) {
      const cart = this.getLocalCart();
      cart.items = cart.items.filter(i => i._id !== itemId && i.productId._id !== productIdForLocalFallback);
      this.saveLocalCart(cart);
      return of({ success: true, message: 'Item removed', data: cart });
    }

    return this.http.delete<CartItemDeleteResponse>(`${this.API_URL}/items/${itemId}`).pipe(
      tap(res => this.updateState(res.data))
    );
  }

  clearCart(): Observable<MessageResponse> {
    if (!this.authService.isAuthenticated()) {
      this.saveLocalCart(this.getEmptyCart());
      return of({ success: true, message: 'Cart cleared' });
    }

    return this.http.delete<MessageResponse>(this.API_URL).pipe(
      tap(() => this.updateState(this.getEmptyCart()))
    );
  }

  // ========================
  // SYNCHRONIZATION
  // ========================

  syncLocalCartToApi(): void {
    const localCart = this.getLocalCart();
    if (localCart.items.length === 0) {
      // Nothing to sync, just reload API cart
      this.initCart();
      return;
    }

    // Sync items sequentially or in parallel. Since the API adds one by one:
    let syncCount = 0;
    localCart.items.forEach(item => {
      this.http.post<CartResponse>(this.API_URL, { productId: item.productId._id, quantity: item.quantity }).subscribe({
        next: () => {
          syncCount++;
          if (syncCount === localCart.items.length) {
            // All synced
            localStorage.removeItem(this.LOCAL_CART_KEY);
            this.initCart(); // reload from API to get DB populated cart
          }
        },
        error: (err) => {
          console.error('Failed to sync item to cart', err);
          syncCount++;
          if (syncCount === localCart.items.length) {
             localStorage.removeItem(this.LOCAL_CART_KEY);
             this.initCart();
          }
        }
      });
    });
  }
}
