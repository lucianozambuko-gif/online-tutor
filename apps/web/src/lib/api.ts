const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type UserStatus = "PENDING_GUARDIAN_CONSENT" | "ACTIVE" | "SUSPENDED" | "DELETED";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
  status: UserStatus;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? "Something went wrong", res.status);
  }

  return res.json();
}

export function login(email: string, password: string): Promise<{ user: CurrentUser }> {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function register(data: {
  email: string;
  password: string;
  name: string;
  role: "STUDENT" | "TUTOR";
  dateOfBirth?: string;
  guardianName?: string;
  guardianEmail?: string;
}): Promise<{ user: CurrentUser; guardianConsentLink?: string }> {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export function logout(): Promise<{ success: boolean }> {
  return apiFetch("/auth/logout", { method: "POST" });
}

export function fetchCurrentUser(): Promise<{ user: CurrentUser | null }> {
  return apiFetch("/auth/me");
}
