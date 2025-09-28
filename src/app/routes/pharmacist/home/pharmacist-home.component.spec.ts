import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacistHomeComponent } from './pharmacist-home.component';

describe('PharmacistHomeComponent', () => {
  let component: PharmacistHomeComponent;
  let fixture: ComponentFixture<PharmacistHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PharmacistHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PharmacistHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
