// src/features/Users/services/UserService.ts
import api from '../utils/api';
import type {
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  RegisterDto,
  LoginDto,
  LoginResponse,
  GetUsersParams,
} from '../../../types/user.types';

class UserService {
  // Create user (admin)
  async createUser(payload: CreateUserDto): Promise<UserDto> {
    const response = await api.post<UserDto>('/Users', payload);
    return response.data;
  }

  // Get users
  async getUsers(params?: GetUsersParams): Promise<UserDto[]> {
    const response = await api.get<UserDto[]>('/Users', { params });
    return response.data;
  }

  // Get user by id
  async getUserById(id: string): Promise<UserDto> {
    const response = await api.get<UserDto>(`/Users/${id}`);
    return response.data;
  }

  // Register
  async register(payload: RegisterDto): Promise<UserDto> {
    const response = await api.post<UserDto>('/Users/register', payload);
    return response.data;
  }

  // Login
  async login(payload: LoginDto): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/Users/login', payload);
    return response.data;
  }

  // Update user
  async updateUser(
    id: string,
    payload: UpdateUserDto
  ): Promise<UserDto> {
    const response = await api.put<UserDto>(`/Users/${id}`, payload);
    return response.data;
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/Users/${id}`);
  }
}

export default new UserService();