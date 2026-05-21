import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, forkJoin, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SubCategoryService } from '../../../core/services/sub-category.service';
import { CartService } from '../../../core/services/cart.service';

import { Product } from '../../../core/models/product.interface';
import { Category } from '../../../core/models/category.interface';
import { SubCategory } from '../../../core/models/sub-category.interface';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit, OnDestroy {
  // Data lists
  products: Product[] = [];
  categories: Category[] = [];
  subCategories: SubCategory[] = [];

  // Filter States
  selectedCategoryId: string | null = null;
  selectedSubCategoryId: string | null = null;
  minPrice: number = 0;
  maxPrice: number = 500; // matching design mockup range
  searchQuery: string = '';
  sortBy: string = '-createdAt'; // defaults to Newest

  // UI / State management
  isLoading: boolean = true;
  isMobileFilterOpen: boolean = false;
  wishlist: Set<string> = new Set<string>();

  // Accordion Toggle States
  accordionStates = {
    gender: true,
    category: true,
    productType: true,
    price: true
  };

  // Pagination States
  currentPage: number = 1;
  limit: number = 9; // matching 3x3 grid mockup
  totalPages: number = 1;
  totalDocuments: number = 0;
  pagesArray: number[] = [];

  // Toast Notification State
  toast = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'info' | 'error'
  };

  // Fallback / Placeholder Images
  fallbackImages: string[] = [
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop'
  ];

  // Debounce for search
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load active wishlist from local storage
    const savedWishlist = localStorage.getItem('maison_wishlist');
    if (savedWishlist) {
      this.wishlist = new Set<string>(JSON.parse(savedWishlist));
    }

    // Set up search debouncing
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query;
        this.currentPage = 1;
        this.loadProducts();
      });

    // Load static lookups and products
    this.loadFiltersAndProducts();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // Load Categories, Subcategories, and initial Product list
  loadFiltersAndProducts(): void {
    this.isLoading = true;
    forkJoin({
      categories: this.categoryService.getAll(),      
      subCategories: this.subCategoryService.getAll()
    }).subscribe({
      next: (res) => {
        // filter active items
        this.categories = res.categories.data.filter(c => c.isActive);
        this.subCategories = res.subCategories.data.filter(s => s.isActive);
        
        // now load products
        this.loadProducts();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load filter metadata', err);
        this.showToast('Could not load filters from API.', 'error');
        // fall back to loading products directly
        this.loadProducts();
        this.cdr.markForCheck();
      }
    });
  }

  // Core API caller for products list
  loadProducts(): void {
    this.isLoading = true;
    const queryParams: Record<string, string> = {
      page: this.currentPage.toString(),
      limit: this.limit.toString(),
      sort: this.sortBy
    };

    if (this.searchQuery.trim()) {
      queryParams['name'] = this.searchQuery.trim();
    }
    if (this.selectedCategoryId) {
      queryParams['categoryId'] = this.selectedCategoryId;
    }
    if (this.selectedSubCategoryId) {
      queryParams['subCategoryId'] = this.selectedSubCategoryId;
    }
    if (this.minPrice > 0) {
      queryParams['price[gte]'] = this.minPrice.toString();
    }
    if (this.maxPrice < 500) {
      queryParams['price[lte]'] = this.maxPrice.toString();
    }

    this.productService.getAll(queryParams).subscribe({
      next: (res) => {
        this.products = res.data;
        this.totalDocuments = res.pagination.totalDocuments;
        this.totalPages = res.pagination.totalPages;
        this.currentPage = res.pagination.currentPage;
        
        this.generatePagesArray();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.showToast('Failed to retrieve products from database.', 'error');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Search input handler
  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  // Sort dropdown selection handler
  onSortChange(event: Event): void {
    this.sortBy = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.loadProducts();
  }

  // Toggle dynamic accordion items
  toggleAccordion(section: 'gender' | 'category' | 'productType' | 'price'): void {
    this.accordionStates[section] = !this.accordionStates[section];
  }

  // Select gender pill (Category)
  selectCategory(id: string | null): void {
    this.selectedCategoryId = id;
    this.currentPage = 1;
    this.loadProducts();
  }

  // Toggle SubCategory filter checkbox
  toggleSubCategory(id: string): void {
    if (this.selectedSubCategoryId === id) {
      this.selectedSubCategoryId = null; // deselect
    } else {
      this.selectedSubCategoryId = id; // single select for robust backend querying
    }
    this.currentPage = 1;
    this.loadProducts();
  }

  // Apply manual price input updates
  applyPriceFilter(): void {
    if (this.minPrice < 0) this.minPrice = 0;
    if (this.maxPrice < this.minPrice) this.maxPrice = this.minPrice;
    this.currentPage = 1;
    this.loadProducts();
  }

  // Reset all filters back to default values
  clearAllFilters(): void {
    this.selectedCategoryId = null;
    this.selectedSubCategoryId = null;
    this.minPrice = 0;
    this.maxPrice = 500;
    this.searchQuery = '';
    this.sortBy = '-createdAt';
    this.currentPage = 1;
    this.loadProducts();
    this.showToast('Filters cleared successfully.', 'info');
  }

  // Add items to server-side shopping cart
  openProductDetails(product: Product): void {
    this.router.navigate(['/products', product.slug, product._id]);
  }

  addToCart(product: Product): void {
    const productMeta = {
      name: product.name,
      price: product.price,
      slug: product.slug,
      images: [this.getProductImage(product, 0)],
      stock: product.stock
    };

    this.cartService.addItem({ productId: product._id, quantity: 1 }, productMeta).subscribe({
      next: () => {
        this.showToast(`"${product.name}" has been added to your cart!`, 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Add to cart failed', err);
        this.showToast('Failed to add item to cart.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // Toggle items on client-side wishlist
  toggleWishlist(productId: string): void {
    if (this.wishlist.has(productId)) {
      this.wishlist.delete(productId);
      this.showToast('Removed from wishlist.', 'info');
    } else {
      this.wishlist.add(productId);
      this.showToast('Added to wishlist.', 'success');
    }
    localStorage.setItem('maison_wishlist', JSON.stringify(Array.from(this.wishlist)));
  }

  // Page index navigation
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadProducts();
  }

  // Calculate dynamic range for standard numbered pagination
  generatePagesArray(): void {
    const pages: number[] = [];
    // Display at most 5 page numbers surrounding the active page
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    this.pagesArray = pages;
  }

  // Helper: return product images, falling back gracefully to fashion illustrations
  getProductImage(product: Product, index: number = 0): string {
    if (product.images && product.images.length > index) {
      const url = product.images[index];
      // Resolve local relative paths from the express backend server
      if (url.startsWith('/uploads')) {
        return `http://localhost:8000${url}`;
      }
      return url;
    }
    // Consistent fallback image mapped to the product's ID hash
    const idx = Math.abs(this.hashCode(product._id)) % this.fallbackImages.length;
    return this.fallbackImages[idx];
  }

  // Helper: check if product stock warning should be displayed
  isLowStock(product: Product): boolean {
    return product.stock > 0 && product.stock <= 3;
  }

  // Toast trigger utility
  showToast(message: string, type: 'success' | 'info' | 'error' = 'success'): void {
    this.toast.message = message;
    this.toast.type = type;
    this.toast.show = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toast.show = false;
      this.cdr.markForCheck();
    }, 3000);
  }

  // Toggle responsive filter overlay
  toggleMobileFilters(): void {
    this.isMobileFilterOpen = !this.isMobileFilterOpen;
  }

  // Count items under a subcategory dynamically or display mockup counts for rich design feel
  getSubcategoryCount(title: string): number {
    const titles: Record<string, number> = {
      'tops': 64,
      'bottoms': 42,
      'outerwear': 38,
      'dresses': 29,
      'accessories': 75,
      'jeans': 42,
      'jackts': 38,
      't-shirts': 64
    };
    return titles[title.toLowerCase()] || 12;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }
}
