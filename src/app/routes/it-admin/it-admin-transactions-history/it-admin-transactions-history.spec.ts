import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItAdminTransactionsHistory } from './it-admin-transactions-history';

describe('ItAdminTransactionsHistory', () => {
  let component: ItAdminTransactionsHistory;
  let fixture: ComponentFixture<ItAdminTransactionsHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItAdminTransactionsHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItAdminTransactionsHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
