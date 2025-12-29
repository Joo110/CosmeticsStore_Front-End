// src/types/user.types.ts
export type UUID = string;

export interface UserDto {
  userId: UUID;
  email: string;
  fullName: string;
  phoneNumber?: string;
  roles: string[];
  createdAtUtc?: string;
  modifiedAtUtc?: string;
}

export interface CreateUserDto {
  email: string;
  fullName: string;
  phoneNumber?: string;
  password: string;
  roles: string[];
}

export interface UpdateUserDto {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  roles?: string[];
}

export interface RegisterDto {
  email: string;
  fullName: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: UserDto;
}

export interface GetUsersParams {
  pageIndex?: number;
  pageSize?: number;
  searchTerm?: string;
  role?: string;
}