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
  // A FormData body (file uploads) must NOT get a manual Content-Type — the
  // browser sets one itself with the correct multipart boundary.
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: isFormData ? { ...init?.headers } : { "Content-Type": "application/json", ...init?.headers },
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

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface OwnTutorProfile {
  id: string;
  userId: string;
  subjects: string[];
  qualifications: string[];
  hourlyRate: string;
  bio: string | null;
  avgRating: string | null;
  verificationStatus: VerificationStatus;
}

export function getOwnTutorProfile(): Promise<OwnTutorProfile> {
  return apiFetch("/tutors/me");
}

export interface AdminTutor {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  tutorProfile: {
    subjects: string[];
    hourlyRate: string;
    bio: string | null;
    verificationStatus: VerificationStatus;
  };
}

export function listAdminTutors(): Promise<AdminTutor[]> {
  return apiFetch("/tutors/admin/list");
}

export function setTutorVerification(tutorId: string, status: VerificationStatus): Promise<AdminTutor> {
  return apiFetch(`/tutors/${tutorId}/verification`, { method: "PATCH", body: JSON.stringify({ status }) });
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

export interface AiMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  imageData: string | null;
  imageMimeType: string | null;
  createdAt: string;
}

export function listAiMessages(): Promise<AiMessage[]> {
  return apiFetch("/ai/messages");
}

export function sendAiMessage(content: string, image?: File): Promise<AiMessage> {
  const form = new FormData();
  form.append("content", content);
  if (image) form.append("image", image);
  return apiFetch("/ai/messages", { method: "POST", body: form });
}

export interface Note {
  id: string;
  topic: string;
  subject: string | null;
  content: string;
  createdAt: string;
}

export function generateNote(data: { topic: string; subject?: string; sourceText?: string }): Promise<Note> {
  return apiFetch("/notes/generate", { method: "POST", body: JSON.stringify(data) });
}

export function listNotes(): Promise<Note[]> {
  return apiFetch("/notes");
}

export function getNote(id: string): Promise<Note> {
  return apiFetch(`/notes/${id}`);
}

export interface FlashcardCard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardSet {
  id: string;
  topic: string;
  createdAt: string;
  cards: FlashcardCard[];
}

export interface FlashcardSetSummary {
  id: string;
  topic: string;
  createdAt: string;
  _count: { cards: number };
}

export function generateFlashcards(data: { topic?: string; noteId?: string; count?: number }): Promise<FlashcardSet> {
  return apiFetch("/flashcards/generate", { method: "POST", body: JSON.stringify(data) });
}

export function listFlashcardSets(): Promise<FlashcardSetSummary[]> {
  return apiFetch("/flashcards");
}

export function getFlashcardSet(id: string): Promise<FlashcardSet> {
  return apiFetch(`/flashcards/${id}`);
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  topic: string;
  difficulty: string | null;
  createdAt: string;
  attempted: boolean;
  score: number | null;
  totalQuestions: number | null;
  questions: QuizQuestion[];
}

export interface QuizSummary {
  id: string;
  topic: string;
  createdAt: string;
  attempted: boolean;
  score: number | null;
  totalQuestions: number | null;
  _count: { questions: number };
}

export function generateQuiz(data: {
  topic?: string;
  noteId?: string;
  difficulty?: "easy" | "medium" | "hard";
  count?: number;
}): Promise<Quiz> {
  return apiFetch("/quizzes/generate", { method: "POST", body: JSON.stringify(data) });
}

export function listQuizzes(): Promise<QuizSummary[]> {
  return apiFetch("/quizzes");
}

export function getQuiz(id: string): Promise<Quiz> {
  return apiFetch(`/quizzes/${id}`);
}

export function submitQuiz(id: string, answers: number[]): Promise<Quiz> {
  return apiFetch(`/quizzes/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) });
}

export interface DashboardSummary {
  notes: { count: number; recent: { id: string; topic: string; subject: string | null; createdAt: string }[] };
  flashcards: {
    count: number;
    recent: { id: string; topic: string; createdAt: string; _count: { cards: number } }[];
  };
  quizzes: {
    count: number;
    recent: {
      id: string;
      topic: string;
      createdAt: string;
      attempted: boolean;
      score: number | null;
      totalQuestions: number | null;
    }[];
  };
  lessons: {
    count: number;
    upcoming: { id: string; subject: string; scheduledAt: string; tutor: { id: string; name: string } }[];
  };
}

export function getStudentDashboard(): Promise<DashboardSummary> {
  return apiFetch("/dashboard/student");
}

export interface TutorDashboardSummary {
  requests: {
    count: number;
    recent: { id: string; subject: string; scheduledAt: string; student: { id: string; name: string } }[];
  };
  students: { count: number; recent: RosterEntry[] };
  sessions: {
    count: number;
    upcoming: { id: string; subject: string; scheduledAt: string; student: { id: string; name: string } }[];
  };
  earnings: { thisMonth: number };
}

export function getTutorDashboard(): Promise<TutorDashboardSummary> {
  return apiFetch("/dashboard/tutor");
}

export interface RosterEntry {
  student: { id: string; name: string; email: string };
  subjects: string[];
  sessionCount: number;
  lastSession: string | null;
  nextSession: string | null;
}

export function listTutorStudents(): Promise<RosterEntry[]> {
  return apiFetch("/tutor-students");
}

export function getTutorStudent(studentId: string): Promise<{ student: { id: string; name: string; email: string }; bookings: Booking[] }> {
  return apiFetch(`/tutor-students/${studentId}`);
}

export interface TutorNote {
  id: string;
  studentId: string;
  bookingId: string | null;
  topic: string;
  content: string;
  attachmentData: string | null;
  attachmentMimeType: string | null;
  attachmentName: string | null;
  createdAt: string;
  student: { id: string; name: string };
}

export function generateTutorNote(data: {
  studentId: string;
  topic: string;
  rawInput: string;
  bookingId?: string;
  attachment?: File;
}): Promise<TutorNote> {
  const form = new FormData();
  form.append("studentId", data.studentId);
  form.append("topic", data.topic);
  form.append("rawInput", data.rawInput);
  if (data.bookingId) form.append("bookingId", data.bookingId);
  if (data.attachment) form.append("attachment", data.attachment);
  return apiFetch("/tutor-notes/generate", { method: "POST", body: form });
}

export function listTutorNotes(studentId?: string): Promise<TutorNote[]> {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
  return apiFetch(`/tutor-notes${query}`);
}

export function getTutorNote(id: string): Promise<TutorNote> {
  return apiFetch(`/tutor-notes/${id}`);
}

export type PayoutStatus = "PENDING" | "PAID" | "FAILED";

export interface Payout {
  id: string;
  tutorId: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: string;
  status: PayoutStatus;
  payoutMethod: string;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
  tutor?: { id: string; name: string; email: string };
}

export function getMyPayoutSummary(): Promise<{ pendingAmount: number; lifetimePaid: number; payouts: Payout[] }> {
  return apiFetch("/payouts/me");
}

export function listAllPayouts(): Promise<Payout[]> {
  return apiFetch("/payouts");
}

export function runPayoutBatch(): Promise<{ created: Payout[] }> {
  return apiFetch("/payouts/run", { method: "POST" });
}

export function markPayoutPaid(id: string, reference?: string): Promise<Payout> {
  return apiFetch(`/payouts/${id}/paid`, { method: "PATCH", body: JSON.stringify({ reference }) });
}

export type IssueCategory = "BOOKING" | "PAYMENT" | "TECHNICAL" | "ACCOUNT" | "OTHER";
export type IssueStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

export interface IssueReport {
  id: string;
  category: IssueCategory;
  subject: string;
  description: string;
  bookingId: string | null;
  status: IssueStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminIssueReport extends IssueReport {
  reporter: { id: string; name: string; email: string; role: "STUDENT" | "TUTOR" | "ADMIN" };
}

export function createIssueReport(data: {
  category: IssueCategory;
  subject: string;
  description: string;
  bookingId?: string;
}): Promise<IssueReport> {
  return apiFetch("/issues", { method: "POST", body: JSON.stringify(data) });
}

export function listMyIssueReports(): Promise<IssueReport[]> {
  return apiFetch("/issues/mine");
}

export function listAllIssueReports(): Promise<AdminIssueReport[]> {
  return apiFetch("/issues");
}

export function updateIssueReport(id: string, data: { status: IssueStatus; adminNotes?: string }): Promise<AdminIssueReport> {
  return apiFetch(`/issues/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export type SubscriptionPlan = "FREE" | "PLUS" | "PRO";
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELLED";

export interface SubscriptionSummary {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  periodEnd: string | null;
  aiMessagesUsed: number;
  aiMessagesLimit: number | null;
  generationsUsed: number;
  generationsLimit: number | null;
  canUseVision: boolean;
}

export function getMySubscription(): Promise<SubscriptionSummary> {
  return apiFetch("/subscriptions/me");
}

export function upgradeSubscription(plan: "PLUS" | "PRO"): Promise<{ actionUrl: string; fields: Record<string, string> }> {
  return apiFetch("/subscriptions/upgrade", { method: "POST", body: JSON.stringify({ plan }) });
}

export function cancelSubscription(): Promise<unknown> {
  return apiFetch("/subscriptions/cancel", { method: "POST" });
}

export interface AdminSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  periodEnd: string | null;
  updatedAt: string;
  student: { id: string; name: string; email: string };
}

export function listAdminSubscriptions(): Promise<AdminSubscription[]> {
  return apiFetch("/subscriptions/admin/list");
}
