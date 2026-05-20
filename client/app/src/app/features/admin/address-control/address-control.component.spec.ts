import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressControlComponent } from './address-control.component';

describe('AddressControlComponent', () => {
  let component: AddressControlComponent;
  let fixture: ComponentFixture<AddressControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressControlComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
