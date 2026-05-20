import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderControlComponent } from './order-control.component';

describe('OrderControlComponent', () => {
  let component: OrderControlComponent;
  let fixture: ComponentFixture<OrderControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderControlComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
