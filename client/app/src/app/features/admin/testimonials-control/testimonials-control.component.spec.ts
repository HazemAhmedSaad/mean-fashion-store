import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestimonialsControlComponent } from './testimonials-control.component';

describe('TestimonialsControlComponent', () => {
  let component: TestimonialsControlComponent;
  let fixture: ComponentFixture<TestimonialsControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestimonialsControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestimonialsControlComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
