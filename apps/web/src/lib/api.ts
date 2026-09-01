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

export interface TutorSummary {
  id: string;
  name: string;
  tutorProfile: {
    subjects: string[];
    hourlyRate: string;
    bio: string | null;
    avgRating: string | null;
    verificationStatus: string;
  };
}

export function listTutors(): Promise<TutorSummary[]> {
  return apiFetch("/tutors");
}

export function updateOwnTutorProfile(data: {
  subjects?: string[];
  qualifications?: string[];
  bio?: string;
  hourlyRate?: number;
}) {
  return apiFetch("/tutors/me", { method: "PATCH", body: JSON.stringify(data) });
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "DISPUTED";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export interface Booking {
  id: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: "ONLINE" | "IN_PERSON";
  status: BookingStatus;
  student: { id: string; name: string; email: string };
  tutor: { id: string; name: string; email: string };
  payment: { id: string; amount: string; status: PaymentStatus } | null;
}

export function createBooking(data: {
  tutorId: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: "ONLINE" | "IN_PERSON";
}): Promise<Booking> {
  return apiFetch("/bookings", { method: "POST", body: JSON.stringify(data) });
}

export function listBookings(): Promise<Booking[]> {
  return apiFetch("/bookings");
}

export function acceptBooking(id: string): Promise<Booking> {
  return apiFetch(`/bookings/${id}/accept`, { method: "PATCH" });
}

export function declineBooking(id: string): Promise<Booking> {
  return apiFetch(`/bookings/${id}/decline`, { method: "PATCH" });
}

export function cancelBooking(id: string): Promise<Booking> {
  return apiFetch(`/bookings/${id}/cancel`, { method: "PATCH" });
}

export function completeBooking(id: string): Promise<Booking> {
  return apiFetch(`/bookings/${id}/complete`, { method: "PATCH" });
}

export function initiatePayment(bookingId: string): Promise<{ actionUrl: string; fields: Record<string, string> }> {
  return apiFetch(`/payments/${bookingId}/initiate`, { method: "POST" });
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
  status: UserStatus;
  createdAt: string;
}

export function listUsers(): Promise<AdminUser[]> {
  return apiFetch("/users");
}

export function deleteUser(id: string): Promise<AdminUser> {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}
