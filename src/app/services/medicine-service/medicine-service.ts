import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateMedicineRequest, Medicine } from "../../models/io-types";
import { MedicineInteractionResponse, Transaction } from '../types';

@Injectable({
  providedIn: 'root'
})
export class MedicineService {
  private readonly http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getToken(): string | null {
    return localStorage.getItem("token") || "";
  }

  getAllMedicines() {
    return this.http.get<Medicine[]>(`${this.apiUrl}/medicines/all`);
  }

  createMedicine(medicineData: CreateMedicineRequest): Observable<Medicine> {
    const formData = new FormData();

    formData.append('name', medicineData.name);
    formData.append('description', medicineData.description);
    formData.append('stock', medicineData.stock.toString());
    formData.append('thumbnail', medicineData.thumbnail);
    medicineData.training_files.forEach((image: string | Blob, index: any) => {
      formData.append(`training_files`, image);
    });

    return this.http.post<Medicine>(`${this.apiUrl}/medicines/add?immediate_training=True`, formData);
  }

  updateMedicine(id: number, medicineData: Partial<CreateMedicineRequest>) {
    const formData = new FormData();

    if (medicineData.name) formData.append('name', medicineData.name);
    if (medicineData.description) formData.append('description', medicineData.description);
    if (medicineData.stock !== undefined) formData.append('stock', medicineData.stock.toString());

    if (medicineData.thumbnail) {
      formData.append('thumbnail', medicineData.thumbnail);
    }

    if (medicineData.training_files) {
      medicineData.training_files.forEach((image: string | Blob, index: any) => {
        formData.append(`training_image_${index}`, image);
      });
    }

    return this.http.put<Medicine>(`${this.apiUrl}/medicines/update/${id}`, formData);
  }

  deleteMedicine(id: number) {
    return this.http.delete<{ detail: string }>(`${this.apiUrl}/medicines/delete/${id}`);
  }

  dispenseMedicine(medicine_name: string, quantity: number) {
    const token = this.getToken();

    return this.http.post<MedicineInteractionResponse>(`${this.apiUrl}/medicines/reduce_stock`, {}, {
      params: {
        medicine_name: medicine_name,
        quantity: quantity.toString()
      },
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
  }

  addStock(medicine_name: string, quantity: number) {
    const token = this.getToken();

    if (!token) {
      console.warn("User is not logged in.");
    }

    return this.http.post<MedicineInteractionResponse>(`${this.apiUrl}/medicines/add_stock`, {}, {
      params: {
        medicine_name: medicine_name,
        quantity: quantity.toString()
      },
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
  }
}
