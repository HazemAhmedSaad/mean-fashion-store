import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsControlComponent } from './products-control.component';

describe('ProductsControlComponent', () => {
  let component: ProductsControlComponent;
  let fixture: ComponentFixture<ProductsControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsControlComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
