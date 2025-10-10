import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItAdminNavigation } from '../it-admin-navigation/it-admin-navigation';
import { TransactionService } from '../../../services/transaction/transaction-service';
import { Transaction, InventoryMode } from '../../../services/types';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-it-admin-transactions-history',
  imports: [CommonModule, ItAdminNavigation, TableModule, ButtonModule, CardModule, TagModule],
  templateUrl: './it-admin-transactions-history.html',
  styleUrl: './it-admin-transactions-history.css'
})
export class ItAdminTransactionsHistory implements OnInit {
  private transactionService = inject(TransactionService);

  // Signals for state management
  transactions = signal<Transaction[]>([]);
  loading = signal(false);
  error = signal('');

  // Pagination signals
  currentPage = signal(0);
  pageSize = signal(10);
  totalRecords = signal(0);

  // Computed signals
  hasTransactions = computed(() => this.transactions().length > 0);

  // Pagination options
  pageSizeOptions = [5, 10, 20, 50];

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading.set(true);
    this.error.set('');

    this.transactionService.all(this.currentPage(), this.pageSize())
      .subscribe({
        next: (data: Transaction[]) => {
          this.transactions.set(data);
          // Note: API should return total count, for now we'll use array length
          this.totalRecords.set(data.length);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading transactions:', error);
          this.error.set('Failed to load transaction history. Please try again.');
          this.loading.set(false);
        }
      });
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.loadTransactions();
  }

  getInventoryModeLabel(mode: InventoryMode): string {
    return mode === InventoryMode.IN ? 'Stock In' : 'Stock Out';
  }

  getInventoryModeSeverity(mode: InventoryMode): 'success' | 'danger' {
    return mode === InventoryMode.IN ? 'success' : 'danger';
  }

  formatDate(dateString: Date): string {
    return new Date(dateString).toLocaleString();
  }

  refreshTransactions() {
    this.currentPage.set(0);
    this.loadTransactions();
  }
}
