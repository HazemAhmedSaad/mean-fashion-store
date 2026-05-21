import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.interface';
import { Category } from '../../../core/models/category.interface';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  category: Category | null = null;
  relatedProducts: Product[] = [];
  isLoading = true;
  isNotFound = false;

  // Gallery state
  activeImageIndex = 0;

  // Selection state (UX-only since backend has no size/color fields)
  selectedSize: string | null = 'M';
  selectedColor: string | null = 'Beige';
  quantity = 1;

  // Wishlist
  isInWishlist = false;

  // Toast
  toast = { show: false, message: '', type: 'success' as 'success' | 'error' | 'info' };

  // Static options
  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  colors = [
    { name: 'Beige',    hex: '#E8DED2' },
    { name: 'White',    hex: '#FFFFFF' },
    { name: 'Black',    hex: '#1A1A1A' },
    { name: 'Olive',    hex: '#6B7C5A' },
    { name: 'Navy',     hex: '#3D5A80' },
  ];

  // Fallback images
  private fallbackImages = [
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
  ];

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  private loadProduct(slug: string): void {
    this.isLoading = true;
    this.isNotFound = false;
    this.activeImageIndex = 0;

    this.productService.getBySlug(slug).subscribe({
      next: (res) => {
        this.product = res.data;

        // Restore wishlist status
        const saved = localStorage.getItem('maison_wishlist');
        const wishlist: string[] = saved ? JSON.parse(saved) : [];
        this.isInWishlist = wishlist.includes(res.data._id);

        // Load related data in parallel
        const requests: any = {
          related: this.productService.getAll({
            categoryId: res.data.categoryId,
            limit: '8',
          })
        };
        if (res.data.categoryId) {
          requests.category = this.categoryService.getById(res.data.categoryId);
        }

        forkJoin(requests).subscribe({
          next: (data: any) => {
            if (data.category) this.category = data.category.data;
            this.relatedProducts = data.related.data.filter(
              (p: Product) => p._id !== this.product!._id
            );
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.isNotFound = true;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Image Gallery ──────────────────────────────────────────────
  getProductImages(): string[] {
    if (!this.product?.images || this.product.images.length === 0) {
      return this.fallbackImages.slice(0, 4);
    }
    return this.product.images.map(url =>
      url.startsWith('/uploads') ? `http://localhost:8000${url}` : url
    );
  }

  getActiveImage(): string {
    return this.getProductImages()[this.activeImageIndex];
  }

  prevImage(): void {
    const imgs = this.getProductImages();
    this.activeImageIndex = (this.activeImageIndex - 1 + imgs.length) % imgs.length;
    this.cdr.markForCheck();
  }

  nextImage(): void {
    const imgs = this.getProductImages();
    this.activeImageIndex = (this.activeImageIndex + 1) % imgs.length;
    this.cdr.markForCheck();
  }

  selectImage(index: number): void {
    this.activeImageIndex = index;
    this.cdr.markForCheck();
  }

  selectSize(size: string): void {
    this.selectedSize = size;
    this.cdr.markForCheck();
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    this.cdr.markForCheck();
  }

  getRelatedImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      const url = product.images[0];
      return url.startsWith('/uploads') ? `http://localhost:8000${url}` : url;
    }
    const idx = Math.abs(this.hashCode(product._id)) % this.fallbackImages.length;
    return this.fallbackImages[idx];
  }

  // ── Quantity ───────────────────────────────────────────────────
  incrementQty(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
      this.cdr.markForCheck();
    }
  }

  decrementQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.cdr.markForCheck();
    }
  }

  // ── Cart ───────────────────────────────────────────────────────
  addToCart(): void {
    if (!this.product) return;
    const images = this.getProductImages();
    const productMeta = {
      name: this.product.name,
      price: this.product.price,
      slug: this.product.slug,
      images: [images[0]],
      stock: this.product.stock,
    };
    this.cartService.addItem({ productId: this.product._id, quantity: this.quantity }, productMeta).subscribe({
      next: () => this.showToast(`"${this.product!.name}" added to cart!`, 'success'),
      error: () => this.showToast('Failed to add to cart.', 'error'),
    });
  }

  // ── Wishlist ───────────────────────────────────────────────────
  toggleWishlist(): void {
    if (!this.product) return;
    const saved = localStorage.getItem('maison_wishlist');
    const wishlist: string[] = saved ? JSON.parse(saved) : [];
    const idx = wishlist.indexOf(this.product._id);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      this.isInWishlist = false;
      this.showToast('Removed from wishlist.', 'info');
    } else {
      wishlist.push(this.product._id);
      this.isInWishlist = true;
      this.showToast('Saved to wishlist!', 'success');
    }
    localStorage.setItem('maison_wishlist', JSON.stringify(wishlist));
    this.cdr.markForCheck();
  }

  // ── Helpers ────────────────────────────────────────────────────
  getDiscountPercent(): number | null {
    if (!this.product || this.product.price <= 0) return null;
    return 27;
  }

  getOriginalPrice(): number | null {
    const discount = this.getDiscountPercent();
    if (!this.product || !discount) return null;
    return Math.round(this.product.price / (1 - discount / 100));
  }

  getRelatedCategoryName(product: Product): string {
    if (this.category && product.categoryId === this.category._id) {
      return this.category.title;
    }
    return 'Collection';
  }

  trackById(_: number, item: Product): string {
    return item._id;
  }

  get isLowStock(): boolean {
    return !!this.product && this.product.stock > 0 && this.product.stock <= 5;
  }

  get isOutOfStock(): boolean {
    return !!this.product && this.product.stock === 0;
  }

  get stockLabel(): string {
    if (!this.product) return '';
    if (this.product.stock === 0) return 'Out of Stock';
    if (this.product.stock <= 5) return `Only ${this.product.stock} Left`;
    return 'In Stock';
  }

  getStars(count: number = 4): number[] {
    return Array(Math.max(0, Math.min(5, Math.round(count)))).fill(0);
  }

  getEmptyStars(count: number = 4): number[] {
    return Array(5 - Math.max(0, Math.min(5, Math.round(count)))).fill(0);
  }

  // Mock rating per product (deterministic based on ID)
  getMockRating(product?: Product): number {
    const p = product ?? this.product;
    if (!p) return 4;
    const hash = Math.abs(this.hashCode(p._id));
    return 3.5 + (hash % 16) / 10; // 3.5 – 5.0
  }

  getMockReviewCount(product?: Product): number {
    const p = product ?? this.product;
    if (!p) return 24;
    return 12 + (Math.abs(this.hashCode(p._id)) % 80);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  // Toast
  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toast = { show: true, message, type };
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toast.show = false;
      this.cdr.markForCheck();
    }, 3000);
  }
}
