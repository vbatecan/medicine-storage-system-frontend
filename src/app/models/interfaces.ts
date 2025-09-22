export enum UserRole {
  PHARMACIST = "PHARMACIST",
  IT_ADMIN = "IT_ADMIN",
  USER = "USER"
}

export interface User {
  id?: string;
  face_name: string;
  email: string;
  is_active: boolean;
  role: UserRole;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserInput {
  face_name: string;
  email: string;
  password: string;
  is_active: boolean;
  role: string;
}

export interface CreateUserRequest {
  user: UserInput;
  selfie_image: File;
}

export interface CreateMedicineRequest {
  name: string;
  description: string;
  stock: number;
  thumbnail: File;
  training_files: File[];
}

export interface Medicine {
  id: number;
  name: string;
  description: string;
  stock: number;
  image_path: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicineFormData {
  name: string;
  description: string;
  stock: number;
  thumbnail: File | undefined;
  training_files?: File[];
}

export interface FileSelectEvent {
  files: File[];
}

export type StockSeverity = 'success' | 'warning' | 'danger' | 'info';
