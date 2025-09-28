import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SystemService {

  private readonly API_URL = environment.apiUrl;
  private readonly http = inject(HttpClient);

  isSystemHealthy() {
    return this.http.get(`${this.API_URL}`);
  }

  getSystemStatus() {
    return this.http.get<{ok: boolean}>(`${this.API_URL}`);
  }
}
