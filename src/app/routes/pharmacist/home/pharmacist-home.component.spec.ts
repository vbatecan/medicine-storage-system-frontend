import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacistHome } from './pharmacist-home.component';

describe('PharmacistHome', () => {
  let component: PharmacistHome;
  let fixture: ComponentFixture<PharmacistHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PharmacistHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PharmacistHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
