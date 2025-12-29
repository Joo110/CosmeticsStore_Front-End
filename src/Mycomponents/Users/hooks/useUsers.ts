// src/features/Users/hooks/useUsers.ts
import { useEffect, useState } from 'react';
import userService from '../../Users/Services/UserService';
import { handleApiError } from '../utils/api';
import type {
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  RegisterDto,
  LoginDto,
  LoginResponse,
  GetUsersParams,
} from '../../../types/user.types';

export const useUsers = (initialPageSize = 20) => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters / paging
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState<string | undefined>();
  const [role, setRole] = useState<string | undefined>();

  const fetchUsers = async (
    opts?: GetUsersParams
  ): Promise<UserDto[]> => {
    setLoading(true);
    setError(null);
    try {
      const params: GetUsersParams = {
        pageIndex: opts?.pageIndex ?? pageIndex,
        pageSize: opts?.pageSize ?? pageSize,
        searchTerm: opts?.searchTerm ?? searchTerm,
        role: opts?.role ?? role,
      };

      const data = await userService.getUsers(params);
      setUsers(data);
      return data;
    } catch (err) {
      setError(handleApiError(err));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getUser = async (id: string): Promise<UserDto | null> => {
    setLoading(true);
    setError(null);
    try {
      return await userService.getUserById(id);
    } catch (err) {
      setError(handleApiError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (
    payload: CreateUserDto
  ): Promise<UserDto> => {
    setLoading(true);
    setError(null);
    try {
      const created = await userService.createUser(payload);
      setUsers((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    payload: RegisterDto
  ): Promise<UserDto> => {
    setLoading(true);
    setError(null);
    try {
      return await userService.register(payload);
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    payload: LoginDto
  ): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);
    try {
      return await userService.login(payload);
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (
    userId: string,
    payload: UpdateUserDto
  ): Promise<UserDto> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await userService.updateUser(userId, payload);
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? updated : u))
      );
      return updated;
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await userService.deleteUser(userId);
      setUsers((prev) =>
        prev.filter((u) => u.userId !== userId)
      );
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setFilters = (filters: {
    searchTerm?: string;
    role?: string;
  }) => {
    setSearchTerm(filters.searchTerm);
    setRole(filters.role);
    setPageIndex(1);
    void fetchUsers({ pageIndex: 1, ...filters });
  };

  const setPage = (page: number) => {
    setPageIndex(page);
    void fetchUsers({ pageIndex: page });
  };

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    users,
    loading,
    error,
    pageIndex,
    pageSize,
    fetchUsers,
    getUser,
    createUser,
    register,
    login,
    updateUser,
    deleteUser,
    setFilters,
    setPage,
    setPageSize,
  };
};

export default useUsers;