import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItAdminHome } from './it-admin-home';

describe('ItAdminHome', () => {
  let component: ItAdminHome;
  let fixture: ComponentFixture<ItAdminHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItAdminHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItAdminHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
