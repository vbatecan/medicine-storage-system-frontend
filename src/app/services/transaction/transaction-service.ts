import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../types';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private readonly API_URL = environment.apiUrl;
  private readonly http = inject(HttpClient);

  all(page: number, size: number) {
    return this.http.get<Transaction[]>(`${this.API_URL}/transactions/all`, {
      params: { page, size },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ""}`
      }
    });
  }

  
}
