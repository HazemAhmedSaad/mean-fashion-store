import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryControlComponent } from './category-control.component';

describe('CategoryControlComponent', () => {
  let component: CategoryControlComponent;
  let fixture: ComponentFixture<CategoryControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryControlComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
