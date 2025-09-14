import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreateMedicineRequest, Medicine } from "../../models/interfaces";

@Injectable({
  providedIn: 'root'
})
export class MedicineService {
  private readonly http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllMedicines() {
    return this.http.get<Medicine[]>(`${this.apiUrl}/medicines/all`);
  }

  getMedicineById(id: number): Observable<ApiResponse<Medicine>> {
    return this.http.get<ApiResponse<Medicine>>(`${this.apiUrl}/medicines/${id}`);
  }

  createMedicine(medicineData: CreateMedicineRequest): Observable<ApiResponse<Medicine>> {
    const formData = new FormData();

    // Add medicine data
    formData.append('name', medicineData.name);
    formData.append('description', medicineData.description);
    formData.append('stock', medicineData.stock.toString());

    // Add thumbnail
    formData.append('thumbnail', medicineData.thumbnail);

    // Add training images
    medicineData.training_images.forEach((image: string | Blob, index: any) => {
      formData.append(`training_image_${index}`, image);
    });

    return this.http.post<ApiResponse<Medicine>>(`${this.apiUrl}/medicines`, formData);
  }

  updateMedicine(id: number, medicineData: Partial<CreateMedicineRequest>): Observable<ApiResponse<Medicine>> {
    const formData = new FormData();

    if (medicineData.name) formData.append('name', medicineData.name);
    if (medicineData.description) formData.append('description', medicineData.description);
    if (medicineData.stock !== undefined) formData.append('stock', medicineData.stock.toString());

    if (medicineData.thumbnail) {
      formData.append('thumbnail', medicineData.thumbnail);
    }

    if (medicineData.training_images) {
      medicineData.training_images.forEach((image: string | Blob, index: any) => {
        formData.append(`training_image_${index}`, image);
      });
    }

    return this.http.put<ApiResponse<Medicine>>(`${this.apiUrl}/medicines/${id}`, formData);
  }

  deleteMedicine(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/medicines/${id}`);
  }
}
