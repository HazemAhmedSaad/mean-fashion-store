import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TestimonialService } from '../../../core/services/testimonial.service';
import { Testimonial } from '../../../core/models/testimonial.interface';

@Component({
  selector: 'app-testimonials-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './testimonials-control.component.html',
  styleUrl: './testimonials-control.component.css',
})
export class TestimonialsControlComponent implements OnInit, OnDestroy {
  testimonials: Testimonial[] = [];
  selectedTestimonial: Testimonial | null = null;
  isDrawerOpen = false;

  isLoading = true;
  isMutating = false;
  errorMessage = '';
  toastMessage = '';

  searchQuery = '';
  selectedStatus = '';
  page = 1;
  limit = 8;
  totalTestimonials = 0;
  totalPages = 1;
  
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  constructor(
    private testimonialService: TestimonialService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query;
        this.page = 1;
        this.loadTestimonials();
      });

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadInitialData(): void {
    this.loadSummary();
    this.loadTestimonials();
  }

  loadSummary(): void {
    this.testimonialService.getAll({ limit: '1000' }).subscribe({
      next: (res) => {
        const all = res.data;
        this.pendingCount = all.filter(t => t.status === 'pending').length;
        this.approvedCount = all.filter(t => t.status === 'approved').length;
        this.rejectedCount = all.filter(t => t.status === 'rejected').length;
        this.cdr.detectChanges();
      }
    });
  }

  loadTestimonials(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: Record<string, string> = {
      page: String(this.page),
      limit: String(this.limit),
      sort: '-createdAt', // Most recent first
    };

    if (this.searchQuery.trim()) params['name'] = this.searchQuery.trim();
    if (this.selectedStatus) params['status'] = this.selectedStatus;

    this.testimonialService.getAll(params).subscribe({
      next: (res) => {
        this.testimonials = res.data;
        if (res.pagination) {
          this.totalTestimonials = res.pagination.totalDocuments || 0;
          this.totalPages = res.pagination.totalPages || 1;
          this.page = res.pagination.currentPage || 1;
        } else {
          this.totalTestimonials = this.testimonials.length;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not load testimonials.';
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
    this.loadTestimonials();
  }

  changePage(targetPage: number): void {
    if (targetPage < 1 || targetPage > this.totalPages || targetPage === this.page) return;
    this.page = targetPage;
    this.loadTestimonials();
  }

  get pages(): number[] {
    const start = Math.max(1, this.page - 1);
    const end = Math.min(this.totalPages, this.page + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  openDrawer(testimonial: Testimonial): void {
    this.selectedTestimonial = testimonial;
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    setTimeout(() => {
      this.selectedTestimonial = null;
    }, 300);
  }

  toggleVisibility(testimonial: Testimonial, event: Event): void {
    event.stopPropagation();
    if (this.isMutating) return;
    this.isMutating = true;
    
    const newVisibility = !testimonial.isVisible;
    
    this.testimonialService.update(testimonial._id, { isVisible: newVisibility }).subscribe({
      next: (res) => {
        testimonial.isVisible = newVisibility;
        this.showToast(`Testimonial ${newVisibility ? 'visible' : 'hidden'}.`);
        this.isMutating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Update failed.', true);
        testimonial.isVisible = !newVisibility; // Revert on failure
        this.isMutating = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(testimonial: Testimonial, newStatus: 'pending' | 'approved' | 'rejected'): void {
    if (this.isMutating || testimonial.status === newStatus) return;
    this.isMutating = true;

    this.testimonialService.update(testimonial._id, { status: newStatus }).subscribe({
      next: (res) => {
        testimonial.status = newStatus;
        if (this.selectedTestimonial && this.selectedTestimonial._id === testimonial._id) {
          this.selectedTestimonial.status = newStatus;
        }
        this.showToast(`Testimonial marked as ${newStatus}.`);
        this.loadSummary();
        this.isMutating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Status update failed.', true);
        this.isMutating = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteTestimonial(id: string): void {
    if (this.isMutating) return;
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    
    this.isMutating = true;
    this.testimonialService.delete(id).subscribe({
      next: () => {
        this.showToast('Testimonial deleted successfully.');
        this.closeDrawer();
        this.loadTestimonials();
        this.loadSummary();
        this.isMutating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Deletion failed.', true);
        this.isMutating = false;
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStarsArray(stars: number): number[] {
    return Array(stars).fill(0);
  }
  
  getEmptyStarsArray(stars: number): number[] {
    return Array(5 - stars).fill(0);
  }

  private showToast(message: string, isError = false): void {
    this.toastMessage = message;
    // We could use an isError flag for toast styling, but here just a simple toast
    window.setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }
}
