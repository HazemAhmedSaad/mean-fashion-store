import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Testimonial } from '../../../core/models/testimonial.interface';

@Component({
  selector: 'app-testimonials',
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css',
})
export class TestimonialsComponent {
  @Input() testimonials: Testimonial[] = [];

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop';

  trackById(index: number, item: Testimonial): string {
    return item._id || `${item.name}-${index}`;
  }

  getStars(count: number): number[] {
    return Array(Math.max(0, Math.min(5, Math.round(count)))).fill(0);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackImage;
  }
}
