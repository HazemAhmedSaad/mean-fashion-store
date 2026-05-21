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
  selector: 'app-sub-category-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sub-category-control.component.html',
  styleUrl: './sub-category-control.component.css',
})
export class SubCategoryControlComponent implements OnInit, OnDestroy {
  subCategories: SubCategory[] = [];
  categories: Category[] = [];
  products: Product[] = [];

  isLoading = true;
  isMutating = false;
  errorMessage = '';
  toastMessage = '';

  // Pagination & Filters
  searchQuery = '';
  selectedCategoryFilter = '';
  page = 1;
  limit = 8;
  totalSubCategories = 0;
  totalPages = 1;

  // Drawer / Form State
  isDrawerOpen = false;
  selectedSubCategory: SubCategory | null = null;
  subCategoryForm = {
    title: '',
    categoryId: '',
    isActive: true,
  };

  // Delete Confirmation Modal State
  isDeleteModalOpen = false;
  subCategoryToDelete: SubCategory | null = null;
  productsCountToDelete = 0;

  // Stats
  totalSubCategoriesCount = 0;
  activeSubCategoriesCount = 0;

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
        this.loadSubCategories();
      });

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadInitialData(): void {
    this.isLoading = true;

    // Load parent categories (for filters and drawer selectors)
    this.categoryService.getAll({ limit: '1000' }).subscribe({
      next: (catRes) => {
        this.categories = catRes.data || [];

        // Load products to compute counts in memory
        this.productService.getAll({ limit: '1000' }).subscribe({
          next: (prodRes) => {
            this.products = prodRes.data || [];
            this.loadSubCategories();
          },
          error: () => {
            this.showToast('Could not load products count.', true);
            this.loadSubCategories();
          }
        });
      },
      error: () => {
        this.showToast('Could not load categories list.', true);
      }
    });
  }

  loadSubCategories(): void {
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

    if (this.selectedCategoryFilter) {
      params['categoryId'] = this.selectedCategoryFilter;
    }

    this.subCategoryService.getAll(params).subscribe({
      next: (res) => {
        this.subCategories = res.data || [];
        if (res.pagination) {
          this.totalSubCategories = res.pagination.totalDocuments || 0;
          this.totalPages = res.pagination.totalPages || 1;
          this.page = res.pagination.currentPage || 1;
        } else {
          this.totalSubCategories = this.subCategories.length;
        }

        // Also fetch total counts for stats (unfiltered)
        this.subCategoryService.getAll({ limit: '1000' }).subscribe({
          next: (allRes) => {
            const all = allRes.data || [];
            this.totalSubCategoriesCount = all.length;
            this.activeSubCategoriesCount = all.filter(s => s.isActive).length;
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.totalSubCategoriesCount = this.totalSubCategories;
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not load sub-categories.';
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
    this.loadSubCategories();
  }

  changePage(targetPage: number): void {
    if (targetPage < 1 || targetPage > this.totalPages || targetPage === this.page) return;
    this.page = targetPage;
    this.loadSubCategories();
  }

  get pages(): number[] {
    const start = Math.max(1, this.page - 1);
    const end = Math.min(this.totalPages, this.page + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  // Getters for templates
  getProductsCount(subCatId: string): number {
    return this.products.filter((p) => p.subCategoryId === subCatId).length;
  }

  getCategoryTitle(subCategory: SubCategory): string {
    if (!subCategory.categoryId) return 'Unassigned';
    const catId = subCategory.categoryId;
    if (typeof catId === 'string') {
      return this.categories.find(c => c._id === catId)?.title || 'Unassigned';
    }
    return catId.title;
  }

  getCategoryBadgeClass(subCategory: SubCategory): string {
    const title = this.getCategoryTitle(subCategory).toLowerCase();
    if (title.includes('men') && !title.includes('women')) return 'badge-men';
    if (title.includes('women')) return 'badge-women';
    if (title.includes('kids')) return 'badge-kids';
    if (title.includes('accessories')) return 'badge-accessories';
    if (title.includes('sale')) return 'badge-sale';
    return 'badge-default';
  }

  // Toggle status
  toggleActive(subCategory: SubCategory, event: Event): void {
    event.stopPropagation();
    if (this.isMutating) return;
    this.isMutating = true;

    const newActiveState = !subCategory.isActive;

    this.subCategoryService.update(subCategory._id, { isActive: newActiveState }).subscribe({
      next: () => {
        subCategory.isActive = newActiveState;
        this.showToast(`Sub-category "${subCategory.title}" is now ${newActiveState ? 'active' : 'inactive'}.`);
        this.isMutating = false;
        this.loadSubCategories(); // Reload stats
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to update status.', true);
        this.isMutating = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Create / Edit Drawer
  openCreateDrawer(): void {
    this.selectedSubCategory = null;
    this.subCategoryForm = {
      title: '',
      categoryId: this.categories.length > 0 ? this.categories[0]._id : '',
      isActive: true,
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(subCategory: SubCategory, event: Event): void {
    event.stopPropagation();
    this.selectedSubCategory = subCategory;
    
    let parentId = '';
    if (subCategory.categoryId) {
      parentId = typeof subCategory.categoryId === 'string' ? subCategory.categoryId : subCategory.categoryId._id;
    }

    this.subCategoryForm = {
      title: subCategory.title,
      categoryId: parentId,
      isActive: subCategory.isActive ?? true,
    };
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  saveSubCategory(): void {
    if (!this.subCategoryForm.title.trim()) {
      this.showToast('Sub-category title is required.', true);
      return;
    }
    if (!this.subCategoryForm.categoryId) {
      this.showToast('Parent category is required.', true);
      return;
    }

    if (this.isMutating) return;
    this.isMutating = true;

    if (this.selectedSubCategory) {
      // Update
      this.subCategoryService.update(this.selectedSubCategory._id, this.subCategoryForm).subscribe({
        next: () => {
          this.showToast(`Sub-category "${this.subCategoryForm.title}" updated successfully.`);
          this.closeDrawer();
          this.isMutating = false;
          this.loadInitialData(); // Refresh everything
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Failed to update sub-category.', true);
          this.isMutating = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create
      this.subCategoryService.create(this.subCategoryForm).subscribe({
        next: () => {
          this.showToast(`Sub-category "${this.subCategoryForm.title}" created successfully.`);
          this.closeDrawer();
          this.isMutating = false;
          this.loadInitialData(); // Refresh everything
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Failed to create sub-category.', true);
          this.isMutating = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Delete
  confirmDelete(subCategory: SubCategory, event: Event): void {
    event.stopPropagation();
    this.subCategoryToDelete = subCategory;
    this.productsCountToDelete = this.getProductsCount(subCategory._id);
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.subCategoryToDelete = null;
  }

  deleteSubCategory(): void {
    if (!this.subCategoryToDelete || this.isMutating) return;
    this.isMutating = true;

    this.subCategoryService.delete(this.subCategoryToDelete._id).subscribe({
      next: () => {
        this.showToast(`Sub-category "${this.subCategoryToDelete?.title}" deleted successfully.`);
        this.closeDeleteModal();
        this.isMutating = false;
        this.loadInitialData();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to delete sub-category.', true);
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
