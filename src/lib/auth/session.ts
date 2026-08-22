import { cookies } from "next/headers";
import type { AuthTokens } from "@/types/api";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const ACCESS_TOKEN_COOKIE = "access_token";
const ID_TOKEN_COOKIE = "id_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

export async function setSessionCookies(tokens: AuthTokens): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, COOKIE_OPTS);
  jar.set(ID_TOKEN_COOKIE, tokens.idToken, COOKIE_OPTS);
  jar.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTS);
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(ID_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
