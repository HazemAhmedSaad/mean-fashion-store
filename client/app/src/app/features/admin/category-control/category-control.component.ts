import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CategoryService } from '../../../core/services/category.service';
import { SubCategoryService } from '../../../core/services/sub-category.service';
import { ProductService } from '../../../core/services/product.service';
import { Category } from '../../../core/models/category.interface';
import { SubCategory } from '../../../core/models/sub-category.interface';
import { Product } from '../../../core/models/product.interface';

@Component({
  selector: 'app-category-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-control.component.html',
  styleUrl: './category-control.component.css',
})
export class CategoryControlComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  products: Product[] = [];

  isLoading = true;
  isMutating = false;
  errorMessage = '';
  toastMessage = '';

  // Pagination & Search
  searchQuery = '';
  page = 1;
  limit = 8;
  totalCategories = 0;
  totalPages = 1;

  // Drawer / Form State
  isDrawerOpen = false;
  selectedCategory: Category | null = null;
  categoryForm = {
    title: '',
    isActive: true,
  };

  // Delete Confirmation Modal State
  isDeleteModalOpen = false;
  categoryToDelete: Category | null = null;
  subCatsCountToDelete = 0;
  productsCountToDelete = 0;

  // Stats
  totalCategoriesCount = 0;
  totalSubCategoriesCount = 0;
  activeCategoriesCount = 0;

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  constructor(
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query;
        this.page = 1;
        this.loadCategories();
      });

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadInitialData(): void {
    this.isLoading = true;
    
    // Fetch all sub-categories and products to calculate counts in memory
    this.subCategoryService.getAll({ limit: '1000' }).subscribe({
      next: (subRes) => {
        this.subCategories = subRes.data || [];
        this.totalSubCategoriesCount = this.subCategories.length;

        this.productService.getAll({ limit: '1000' }).subscribe({
          next: (prodRes) => {
            this.products = prodRes.data || [];
            this.loadCategories();
          },
          error: (err) => {
            this.showToast('Could not load products count.', true);
            this.loadCategories();
          }
        });
      },
      error: (err) => {
        this.showToast('Could not load sub-categories count.', true);
        this.loadCategories();
      }
    });
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: Record<string, string> = {
      page: String(this.page),
      limit: String(this.limit),
      sort: '-createdAt',
    };

    if (this.searchQuery.trim()) {
      params['title'] = this.searchQuery.trim();
    }

    this.categoryService.getAll(params).subscribe({
      next: (res) => {
        this.categories = res.data || [];
        if (res.pagination) {
          this.totalCategories = res.pagination.totalDocuments || 0;
          this.totalPages = res.pagination.totalPages || 1;
          this.page = res.pagination.currentPage || 1;
        } else {
          this.totalCategories = this.categories.length;
        }

        // Also fetch total counts for stats (without filters)
        this.categoryService.getAll({ limit: '1000' }).subscribe({
          next: (allRes) => {
            const all = allRes.data || [];
            this.totalCategoriesCount = all.length;
            this.activeCategoriesCount = all.filter(c => c.isActive).length;
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.totalCategoriesCount = this.totalCategories;
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not load categories.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSearchInput(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  changePage(targetPage: number): void {
    if (targetPage < 1 || targetPage > this.totalPages || targetPage === this.page) return;
    this.page = targetPage;
    this.loadCategories();
  }

  get pages(): number[] {
    const start = Math.max(1, this.page - 1);
    const end = Math.min(this.totalPages, this.page + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  // Helper getters for templates
  getSubCategoriesCount(catId: string): number {
    return this.subCategories.filter(
      (s) => s.categoryId && (typeof s.categoryId === 'string' ? s.categoryId === catId : s.categoryId._id === catId)
    ).length;
  }

  getProductsCount(catId: string): number {
    return this.products.filter((p) => p.categoryId === catId).length;
  }

  getSlug(title: string): string {
    return `/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`;
  }

  // Toggles active state in-place
  toggleActive(category: Category, event: Event): void {
    event.stopPropagation();
    if (this.isMutating) return;
    this.isMutating = true;

    const newActiveState = !category.isActive;

    this.categoryService.update(category._id, { isActive: newActiveState }).subscribe({
      next: (res) => {
        category.isActive = newActiveState;
        this.showToast(`Category "${category.title}" is now ${newActiveState ? 'active' : 'inactive'}.`);
        this.isMutating = false;
        this.loadCategories(); // Refresh stats
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to update category status.', true);
        this.isMutating = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Form Drawer actions
  openCreateDrawer(): void {
    this.selectedCategory = null;
    this.categoryForm = {
      title: '',
      isActive: true,
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(category: Category, event: Event): void {
    event.stopPropagation();
    this.selectedCategory = category;
    this.categoryForm = {
      title: category.title,
      isActive: category.isActive,
    };
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  saveCategory(): void {
    if (!this.categoryForm.title.trim()) {
      this.showToast('Category title is required.', true);
      return;
    }

    if (this.isMutating) return;
    this.isMutating = true;

    if (this.selectedCategory) {
      // Update
      this.categoryService.update(this.selectedCategory._id, this.categoryForm).subscribe({
        next: () => {
          this.showToast(`Category "${this.categoryForm.title}" updated successfully.`);
          this.closeDrawer();
          this.isMutating = false;
          this.loadInitialData(); // Reload stats and items
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Failed to update category.', true);
          this.isMutating = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create
      this.categoryService.create(this.categoryForm).subscribe({
        next: () => {
          this.showToast(`Category "${this.categoryForm.title}" created successfully.`);
          this.closeDrawer();
          this.isMutating = false;
          this.loadInitialData(); // Reload stats and items
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Failed to create category.', true);
          this.isMutating = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Delete modal actions
  confirmDelete(category: Category, event: Event): void {
    event.stopPropagation();
    this.categoryToDelete = category;
    this.subCatsCountToDelete = this.getSubCategoriesCount(category._id);
    this.productsCountToDelete = this.getProductsCount(category._id);
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.categoryToDelete = null;
  }

  deleteCategory(): void {
    if (!this.categoryToDelete || this.isMutating) return;
    this.isMutating = true;

    this.categoryService.delete(this.categoryToDelete._id).subscribe({
      next: () => {
        this.showToast(`Category "${this.categoryToDelete?.title}" deleted successfully.`);
        this.closeDeleteModal();
        this.isMutating = false;
        this.loadInitialData(); // Reload stats and items
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to delete category.', true);
        this.isMutating = false;
        this.cdr.detectChanges();
      }
    });
  }

  private showToast(message: string, isError = false): void {
    this.toastMessage = message;
    if (isError) {
      console.error(message);
    }
    window.setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }
}
