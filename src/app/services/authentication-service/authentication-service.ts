import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../../models/responses';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, { email, password });
  }
}
