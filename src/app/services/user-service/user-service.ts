import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { User, UserInput } from '../../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${ this.API_URL }/users/all`);
  }

  create(userInput: UserInput, selfieImage: File): Observable<User> {
    const formData = new FormData();

    // Add user data as form fields
    formData.append('face_name', userInput.face_name);
    formData.append('email', userInput.email);
    formData.append('password', userInput.password);
    formData.append('is_active', userInput.is_active.toString());
    formData.append('role', userInput.role);

    // Add selfie image
    formData.append('selfie_image', selfieImage);

    return this.http.post<User>(`${ this.API_URL }/users/create`, formData);
  }
}
