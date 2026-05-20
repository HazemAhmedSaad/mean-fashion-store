import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartControlComponent } from './cart-control.component';

describe('CartControlComponent', () => {
  let component: CartControlComponent;
  let fixture: ComponentFixture<CartControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartControlComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
