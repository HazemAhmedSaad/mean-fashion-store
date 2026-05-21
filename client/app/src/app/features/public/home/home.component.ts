import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';
import { TestimonialService } from '../../../core/services/testimonial.service';
import { CartService } from '../../../core/services/cart.service';

import { Category } from '../../../core/models/category.interface';
import { Product } from '../../../core/models/product.interface';
import { Testimonial } from '../../../core/models/testimonial.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  newArrivals: Product[] = [];
  apiTestimonials: Testimonial[] = [];

  isLoading = true;

  fallbackImage =
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop';

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private testimonialService: TestimonialService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadHomeData();
  }

  private loadHomeData(): void {
    forkJoin({
      categories: this.categoryService.getAll(),
      products: this.productService.getAll({
        sort: 'createdAt',
        limit: '8',
      }),
      testimonials: this.testimonialService.getVisible({ limit: '5' }),
    }).subscribe({
      next: (response) => {
        this.categories = response.categories.data;
        this.newArrivals = response.products.data;
        this.apiTestimonials = response.testimonials.data;
        console.log(response);
        this.isLoading = false;
        this.cdr.markForCheck();
      },

      error: (err) => {
        console.error('Home API Error:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  trackById(index: number, item: any): string {
    return item._id;
  }

  getStars(count: number): number[] {
    return Array(count).fill(0);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackImage;
  }

  addToCart(product: Product): void {
    const productMeta = {
      name: product.name,
      price: product.price,
      slug: product.slug,
      images: [product.images?.[0] ? 'http://localhost:8000' + product.images[0] : this.fallbackImage],
      stock: product.stock
    };

    this.cartService.addItem({ productId: product._id, quantity: 1 }, productMeta).subscribe({
      next: () => {
        // You would typically show a toast here, but we will just trigger CD
        alert(`"${product.name}" has been added to your cart!`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Add to cart failed', err);
        alert('Failed to add item to cart.');
        this.cdr.markForCheck();
      }
    });
  }
}