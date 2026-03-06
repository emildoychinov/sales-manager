export interface AuthUser {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  errorMessage: string;
  isAuthenticated: boolean;
}

export type AuthMode = "login" | "register";

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}
