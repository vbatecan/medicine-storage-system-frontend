export interface User {
  id?: string;
  face_name: string;
  email: string;
  is_active: boolean;
  role: string;
  created_at?: string;
  updated_at?: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
