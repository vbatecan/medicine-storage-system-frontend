import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KioskInterface } from './kiosk-interface';

describe('KioskInterface', () => {
  let component: KioskInterface;
  let fixture: ComponentFixture<KioskInterface>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KioskInterface]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KioskInterface);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
