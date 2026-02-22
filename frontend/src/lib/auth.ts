import type { UserType } from "./api";

const TOKEN_KEY = "tb_token";
const USER_TYPE_KEY = "tb_user_type";
const IS_PRO_KEY = "tb_is_pro";

export function saveAuth(token: string, userType: UserType) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_TYPE_KEY, userType);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUserType(): UserType | null {
  return localStorage.getItem(USER_TYPE_KEY) as UserType | null;
}

export function saveProStatus(isPro: boolean) {
  localStorage.setItem(IS_PRO_KEY, String(isPro));
}

export function getIsPro(): boolean {
  return localStorage.getItem(IS_PRO_KEY) === "true";
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  localStorage.removeItem(IS_PRO_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
