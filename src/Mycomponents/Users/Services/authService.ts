import api from '../../Users/utils/api';
import Cookies from 'js-cookie';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../../../types/auth.types';

class AuthService {
  // ================= LOGIN =================
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/Users/login', data);

    if (response.data.token) {
      Cookies.set('authToken', response.data.token, {
        expires: 7,
        secure: true,
        sameSite: 'strict',
      });

      Cookies.set('user', JSON.stringify(response.data), {
        expires: 7,
        secure: true,
        sameSite: 'strict',
      });
    }

    return response.data;
  }

  // ================= REGISTER =================
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const registerData = { ...data, confirmPassword: undefined };

    const response = await api.post<AuthResponse>(
      '/Users/register',
      registerData
    );

    if (response.data.token) {
      Cookies.set('authToken', response.data.token, {
        expires: 7,
        secure: true,
        sameSite: 'strict',
      });

      Cookies.set('user', JSON.stringify(response.data), {
        expires: 7,
        secure: true,
        sameSite: 'strict',
      });
    }

    return response.data;
  }

  // ================= FORGOT PASSWORD =================
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await api.post('/Users/forgot-password', data);
  }

  // ================= RESET PASSWORD =================
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post('/Users/reset-password', data);
  }

  // ================= GET PROFILE =================
  async getProfile(): Promise<UserProfile> {
    const userStr = Cookies.get('user');
    if (!userStr) throw new Error('No user found');

    const user = JSON.parse(userStr) as AuthResponse;
    const response = await api.get<UserProfile>(`/Users/${user.userId}`);
    return response.data;
  }

  // ================= UPDATE PROFILE =================
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const userStr = Cookies.get('user');
    if (!userStr) throw new Error('No user found');

    const user = JSON.parse(userStr) as AuthResponse;
    const response = await api.put<UserProfile>(
      `/Users/${user.userId}`,
      data
    );
    return response.data;
  }

  // ================= CHANGE PASSWORD =================
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const userStr = Cookies.get('user');
    if (!userStr) throw new Error('No user found');

    const user = JSON.parse(userStr) as AuthResponse;
    await api.post(`/Users/${user.userId}/change-password`, data);
  }

  // ================= LOGOUT =================
  logout(): void {
    Cookies.remove('authToken');
    Cookies.remove('user');
  }

  // ================= AUTH CHECK =================
  isAuthenticated(): boolean {
    return !!Cookies.get('authToken');
  }

  // ================= CURRENT USER =================
  getCurrentUser(): AuthResponse | null {
    const userStr = Cookies.get('user');
    if (!userStr) return null;
    return JSON.parse(userStr) as AuthResponse;
  }
}

const authService = new AuthService();
export default authService;