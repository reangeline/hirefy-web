// Tipos espelhando os DTOs do backend Go (backend_hirefy).
// Ver internal/core/ports/inbound/auth_service.go e internal/adapters/inbound/http/handler/auth_handler.go

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface ConfirmSignUpRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ConfirmForgotPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

/**
 * O backend hoje só emite snake_case em AuthResponse, mas o mobile trata as duas formas
 * defensivamente (resquício de uma versão anterior do backend) — mantemos o mesmo cuidado
 * aqui até validar contra o ambiente de dev. Ver .spec/001-auth/spec.md.
 */
export interface RawAuthResponse {
  access_token?: string;
  AccessToken?: string;
  id_token?: string;
  IDToken?: string;
  refresh_token?: string;
  RefreshToken?: string;
  expires_in?: number;
  ExpiresIn?: number;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface BackendErrorBody {
  error?: string;
  message?: string;
}
