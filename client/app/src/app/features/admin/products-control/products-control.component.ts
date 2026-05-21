import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Category } from '../../../core/models/category.interface';
import { Product } from '../../../core/models/product.interface';
import { SubCategory } from '../../../core/models/sub-category.interface';
import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';
import { SubCategoryService } from '../../../core/services/sub-category.service';

@Component({
  selector: 'app-products-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products-control.component.html',
  styleUrl: './products-control.component.css',
})
export class ProductsControlComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  selectedIds = new Set<string>();

  isLoading = true;
  isMutating = false;
  errorMessage = '';
  toastMessage = '';

  searchQuery = '';
  selectedCategoryId = '';
  selectedStatus = '';
  sortBy = '-createdAt';
  page = 1;
  limit = 8;
  totalProducts = 0;
  totalPages = 1;
  activeCount = 0;
  inactiveCount = 0;

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;
  private readonly imageBaseUrl = 'http://localhost:8000';
  private readonly fallbackImage =
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=300&auto=format&fit=crop';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query;
        this.page = 1;
        this.loadProducts();
      });

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      categories: this.categoryService.getAll({ limit: '100' }),
      subCategories: this.subCategoryService.getAll({ limit: '200' }),
      summary: this.productService.getAll({ limit: '1000' }),
    }).subscribe({
      next: ({ categories, subCategories, summary }) => {
        this.categories = categories.data;
        this.subCategories = subCategories.data;
        this.activeCount = summary.data.filter((product) => product.isActive).length;
        this.inactiveCount = summary.data.filter((product) => !product.isActive).length;
        this.loadProducts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not load product data.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedIds.clear();

    const params: Record<string, string> = {
      page: String(this.page),
      limit: String(this.limit),
      sort: this.sortBy,
    };

    if (this.searchQuery.trim()) params['name'] = this.searchQuery.trim();
    if (this.selectedCategoryId) params['categoryId'] = this.selectedCategoryId;
    if (this.selectedStatus) params['isActive'] = this.selectedStatus;

    this.productService.getAll(params).subscribe({
      next: (res) => {
        this.products = res.data;
        this.totalProducts = res.pagination.totalDocuments;
        this.totalPages = res.pagination.totalPages;
        this.page = res.pagination.currentPage;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not load products.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSearchInput(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  applyFilters(): void {
    this.page = 1;
    this.loadProducts();
  }

  changeSort(sort: string): void {
    this.sortBy = sort;
    this.loadProducts();
  }

  goToPage(targetPage: number): void {
    if (targetPage < 1 || targetPage > this.totalPages || targetPage === this.page) return;
    this.page = targetPage;
    this.loadProducts();
  }

  toggleSelection(productId: string): void {
    if (this.selectedIds.has(productId)) {
      this.selectedIds.delete(productId);
    } else {
      this.selectedIds.add(productId);
    }
  }

  toggleCurrentPageSelection(): void {
    if (this.isCurrentPageSelected) {
      this.products.forEach((product) => this.selectedIds.delete(product._id));
      return;
    }

    this.products.forEach((product) => this.selectedIds.add(product._id));
  }

  selectAllCurrentProducts(): void {
    this.products.forEach((product) => this.selectedIds.add(product._id));
  }

  toggleActive(product: Product): void {
    this.updateProductStatus(product, !product.isActive);
  }

  bulkActivate(): void {
    this.bulkUpdateStatus(true);
  }

  bulkDeactivate(): void {
    this.bulkUpdateStatus(false);
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0 || this.isMutating) return;
    this.isMutating = true;
    const requests = Array.from(this.selectedIds).map((id) => this.productService.delete(id));

    forkJoin(requests).subscribe({
      next: () => {
        this.showToast(`${requests.length} product(s) deleted.`);
        this.refreshAfterMutation();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not delete selected products.';
        this.isMutating = false;
        this.cdr.detectChanges();
      },
    });
  }

  private updateProductStatus(product: Product, isActive: boolean): void {
    if (this.isMutating) return;
    this.isMutating = true;

    const formData = new FormData();
    formData.append('isActive', String(isActive));

    this.productService.update(product._id, formData).subscribe({
      next: (res) => {
        this.products = this.products.map((item) => item._id === product._id ? res.data : item);
        this.showToast(`${product.name} ${isActive ? 'activated' : 'deactivated'}.`);
        this.isMutating = false;
        this.refreshSummary();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not update product status.';
        this.isMutating = false;
        this.cdr.detectChanges();
      },
    });
  }

  private bulkUpdateStatus(isActive: boolean): void {
    if (this.selectedIds.size === 0 || this.isMutating) return;
    this.isMutating = true;

    const requests = Array.from(this.selectedIds).map((id) => {
      const formData = new FormData();
      formData.append('isActive', String(isActive));
      return this.productService.update(id, formData);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.showToast(`${requests.length} product(s) ${isActive ? 'activated' : 'deactivated'}.`);
        this.refreshAfterMutation();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not update selected products.';
        this.isMutating = false;
        this.cdr.detectChanges();
      },
    });
  }

  private refreshAfterMutation(): void {
    this.isMutating = false;
    this.selectedIds.clear();
    this.refreshSummary();
    this.loadProducts();
  }

  private refreshSummary(): void {
    this.productService.getAll({ limit: '1000' }).subscribe({
      next: (summary) => {
        this.activeCount = summary.data.filter((product) => product.isActive).length;
        this.inactiveCount = summary.data.filter((product) => !product.isActive).length;
        this.cdr.detectChanges();
      },
    });
  }

  get isCurrentPageSelected(): boolean {
    return this.products.length > 0 && this.products.every((product) => this.selectedIds.has(product._id));
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get pages(): number[] {
    const start = Math.max(1, this.page - 1);
    const end = Math.min(this.totalPages, this.page + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  getCategoryName(categoryId: string): string {
    return this.categories.find((category) => category._id === categoryId)?.title || 'Unassigned';
  }

  getSubCategoryName(subCategoryId: string): string {
    return this.subCategories.find((subCategory) => subCategory._id === subCategoryId)?.title || 'None';
  }

  getProductImage(product: Product): string {
    const image = product.images?.[0];
    if (!image) return this.fallbackImage;
    return image.startsWith('/uploads') ? `${this.imageBaseUrl}${image}` : image;
  }

  isLowStock(product: Product): boolean {
    return product.stock > 0 && product.stock <= 10;
  }

  trackById(_: number, product: Product): string {
    return product._id;
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    window.setTimeout(() => {
      this.toastMessage = '';
    }, 2600);
  }
}
