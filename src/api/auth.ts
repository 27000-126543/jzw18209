import client from './client';
import { AuthResponse, RegisterRequest, LoginRequest, User } from '../../shared/types';

export const authApi = {
  register: (data: RegisterRequest) =>
    client.post<AuthResponse>('/auth/register', data).then(res => res.data),

  login: (data: LoginRequest) =>
    client.post<AuthResponse>('/auth/login', data).then(res => res.data),

  me: () =>
    client.get<User>('/auth/me').then(res => res.data),
};
