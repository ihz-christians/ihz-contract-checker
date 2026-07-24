export type UserRole = 'customer' | 'salesperson' | 'manager' | 'regulator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  agencyId?: string;
  customerId?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  role: UserRole;
  agencyId?: string;
}
