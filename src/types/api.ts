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
 * Mesmo contrato usado pelo mobile (auth_service.dart: signInWithSocial). O endpoint
 * POST /auth/social não está registrado no backend hoje — ver .spec/001-auth/spec.md.
 */
export interface SocialSignInRequest {
  provider: "google" | "apple";
  id_token: string;
  name?: string;
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

// Ver internal/adapters/inbound/http/handler/user_handler.go (GetMe)
export interface MeResponse {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
}

/**
 * Ver internal/core/domain/subscription.go e subscription_handler.go (GetSubscription).
 * Quando o usuário não tem subscription no banco, o backend retorna só
 * { plan: "free", status: "active" } (sem credits/id) — por isso os campos extras são opcionais.
 * `is_active` NÃO existe no JSON (é um método Go, `IsActive()`, não serializado) — a
 * premium-ness precisa ser calculada no client a partir de plan+status, nunca lida direto.
 */
export interface SubscriptionResponse {
  id?: string;
  user_id?: string;
  plan: "free" | "basic" | "premium";
  status: "active" | "canceled" | "expired" | "past_due";
  credits?: number;
  current_period_end?: string;
}
