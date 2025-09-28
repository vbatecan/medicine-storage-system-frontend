import { User } from '../services/types';

export interface LoginResponse {
  access_token: string;
  ok: boolean;
  token_type: string;
  user: User;
}
