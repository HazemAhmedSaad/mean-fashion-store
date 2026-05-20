import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubCategoryControlComponent } from './sub-category-control.component';

describe('SubCategoryControlComponent', () => {
  let component: SubCategoryControlComponent;
  let fixture: ComponentFixture<SubCategoryControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubCategoryControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubCategoryControlComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
