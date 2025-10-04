export interface User {
  id: string;
  phone: string;
  role: 'owner' | 'manager' | 'attendant';
  name?: string;
  businessId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface SignupCredentials {
  phone: string;
  password: string;
  name: string;
  role: 'owner' | 'manager' | 'attendant';
  businessId?: string;
}

export interface PasswordResetRequest {
  phone: string;
}

export interface PasswordResetConfirm {
  phone: string;
  otp: string;
  newPassword: string;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (request: PasswordResetRequest) => Promise<void>;
  confirmPasswordReset: (confirm: PasswordResetConfirm) => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<void>;
}
