// Relative and same-origin on purpose — next.config.ts rewrites this to the
// real API (NEXT_PUBLIC_API_URL) server-side, so the browser never makes a
// cross-site request/cookie exchange at all. See next.config.ts for why.
const API_URL = "/api";

export type UserStatus = "PENDING_GUARDIAN_CONSENT" | "ACTIVE" | "SUSPENDED" | "DELETED";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
  status: UserStatus;
  avatarUrl: string | null;
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

export type InstitutionType = "SCHOOL" | "COLLEGE" | "VARSITY" | "ONLINE_INSTITUTE";

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  SCHOOL: "School",
  COLLEGE: "College",
  VARSITY: "Varsity",
  ONLINE_INSTITUTE: "Online institute",
};

export function register(data: {
  email: string;
  password: string;
  name: string;
  role: "STUDENT" | "TUTOR";
  grade?: string;
  institutionType?: InstitutionType;
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

export function uploadAvatar(file: File): Promise<{ id: string; avatarUrl: string | null }> {
  const form = new FormData();
  form.append("avatar", file);
  return apiFetch("/users/me/avatar", { method: "PATCH", body: form });
}

export function removeAvatar(): Promise<{ id: string; avatarUrl: string | null }> {
  return apiFetch("/users/me/avatar", { method: "DELETE" });
}

export type GradeLevel = "PRIMARY" | "HIGH_SCHOOL" | "VARSITY";

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  PRIMARY: "Primary",
  HIGH_SCHOOL: "High School",
  VARSITY: "Varsity",
};

export interface TutorSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  tutorProfile: {
    subjects: string[];
    gradeLevels: GradeLevel[];
    qualifications: string[];
    hourlyRate: string;
    bio: string | null;
    avgRating: string | null;
    verificationStatus: string;
    transcriptVerified: boolean;
  };
}

export function listTutors(): Promise<TutorSummary[]> {
  return apiFetch("/tutors");
}

export function getTutor(id: string): Promise<TutorSummary> {
  return apiFetch(`/tutors/${id}`);
}

export interface TutorBusySlot {
  scheduledAt: string;
  durationMinutes: number;
}

export function getTutorBusySlots(id: string): Promise<TutorBusySlot[]> {
  return apiFetch(`/tutors/${id}/busy-slots`);
}

export const MIN_HOURLY_RATE_ZAR = 50;

export type BankAccountType = "SAVINGS" | "CHEQUE";

export function updateOwnTutorProfile(data: {
  subjects?: string[];
  gradeLevels?: GradeLevel[];
  qualifications?: string[];
  bio?: string;
  hourlyRate?: number;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: BankAccountType;
}) {
  return apiFetch("/tutors/me", { method: "PATCH", body: JSON.stringify(data) });
}

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface OwnTutorProfile {
  id: string;
  userId: string;
  subjects: string[];
  gradeLevels: GradeLevel[];
  qualifications: string[];
  hourlyRate: string;
  bio: string | null;
  avgRating: string | null;
  verificationStatus: VerificationStatus;
  transcriptName: string | null;
  transcriptVerified: boolean;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  branchCode: string | null;
  accountType: BankAccountType | null;
}

export function getOwnTutorProfile(): Promise<OwnTutorProfile> {
  return apiFetch("/tutors/me");
}

export function uploadTutorTranscript(file: File): Promise<OwnTutorProfile> {
  const form = new FormData();
  form.append("transcript", file);
  return apiFetch("/tutors/me/transcript", { method: "PATCH", body: form });
}

export interface AdminTutor {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  tutorProfile: {
    subjects: string[];
    gradeLevels: GradeLevel[];
    hourlyRate: string;
    bio: string | null;
    verificationStatus: VerificationStatus;
    transcriptName: string | null;
    transcriptMimeType: string | null;
    transcriptData: string | null;
    transcriptVerified: boolean;
  };
}

export function setTutorTranscriptVerified(tutorId: string, verified: boolean): Promise<AdminTutor> {
  return apiFetch(`/tutors/${tutorId}/transcript-verified`, {
    method: "PATCH",
    body: JSON.stringify({ verified }),
  });
}

export function listAdminTutors(): Promise<AdminTutor[]> {
  return apiFetch("/tutors/admin/list");
}

export function setTutorVerification(tutorId: string, status: VerificationStatus): Promise<AdminTutor> {
  return apiFetch(`/tutors/${tutorId}/verification`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "DISPUTED";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED";

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: "ONLINE" | "IN_PERSON";
  status: BookingStatus;
  meetingUrl: string | null;
  student: { id: string; name: string; email: string };
  tutor: { id: string; name: string; email: string };
  payment: { id: string; amount: string; status: PaymentStatus } | null;
  review: Review | null;
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

export interface MeetingToken {
  domain: string;
  /** "<JaaS appId>/lumen-<bookingId>" */
  roomName: string;
  jwt: string;
  role: "tutor" | "student";
  subject: string;
  otherPartyName: string;
  endsAt: string;
}

export function getMeetingToken(bookingId: string): Promise<MeetingToken> {
  return apiFetch(`/meetings/${bookingId}/token`);
}

export interface MeetingAttendance {
  bookingId: string;
  tutorMinutes: number;
  studentMinutes: number;
  meetingStartedAt: string | null;
  meetingEndedAt: string | null;
}

export function getMeetingAttendance(bookingId: string): Promise<MeetingAttendance> {
  return apiFetch(`/meetings/${bookingId}/attendance`);
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

export interface BookingMessage {
  id: string;
  body: string;
  sentAt: string;
  flagged: boolean;
  sender: { id: string; name: string; role: "STUDENT" | "TUTOR" | "ADMIN" };
}

export function listBookingMessages(bookingId: string): Promise<BookingMessage[]> {
  return apiFetch(`/bookings/${bookingId}/messages`);
}

export function sendBookingMessage(bookingId: string, body: string): Promise<BookingMessage> {
  return apiFetch(`/bookings/${bookingId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
}

export function flagMessage(messageId: string): Promise<BookingMessage> {
  return apiFetch(`/messages/${messageId}/flag`, { method: "PATCH" });
}

export interface AdminFlaggedMessage extends BookingMessage {
  conversation: {
    booking: { id: string; subject: string; scheduledAt: string } | null;
    participants: { user: { id: string; name: string; role: "STUDENT" | "TUTOR" | "ADMIN" } }[];
  };
}

export function listAdminFlaggedMessages(): Promise<AdminFlaggedMessage[]> {
  return apiFetch("/messages/admin/flagged");
}

export interface TutorReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  studentDisplayName: string;
}

export function createReview(data: { bookingId: string; rating: number; comment?: string }): Promise<Review> {
  return apiFetch("/reviews", { method: "POST", body: JSON.stringify(data) });
}

export function listMyReviews(): Promise<Review[]> {
  return apiFetch("/reviews/mine");
}

export function listTutorReviews(tutorId: string): Promise<TutorReview[]> {
  return apiFetch(`/reviews/tutor/${tutorId}`);
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

export type AiAttachment =
  | { kind: "IMAGE"; name: string; mimeType: string; data: string }
  | { kind: "DOCUMENT"; name: string; mimeType: string; text: string };

export interface AiMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  attachments: AiAttachment[] | null;
  createdAt: string;
}

export function listAiMessages(): Promise<AiMessage[]> {
  return apiFetch("/ai/messages");
}

export function sendAiMessage(content: string, images: File[] = [], documents: File[] = []): Promise<AiMessage> {
  const form = new FormData();
  form.append("content", content);
  images.forEach((f) => form.append("images", f));
  documents.forEach((f) => form.append("documents", f));
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
  studentId: string | null;
  bookingId: string | null;
  topic: string;
  content: string;
  attachmentData: string | null;
  attachmentMimeType: string | null;
  attachmentName: string | null;
  createdAt: string;
  student: { id: string; name: string } | null;
}

export function generateTutorNote(data: {
  studentId?: string;
  topic: string;
  rawInput: string;
  bookingId?: string;
  attachment?: File;
}): Promise<TutorNote> {
  const form = new FormData();
  if (data.studentId) form.append("studentId", data.studentId);
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

export interface PayoutBankDetails {
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  branchCode: string | null;
  accountType: BankAccountType | null;
}

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
  totalMinutes: number;
  tutor?: { id: string; name: string; email: string; tutorProfile: PayoutBankDetails };
}

export function getMyPayoutSummary(): Promise<{
  pendingAmount: number;
  pendingMinutes: number;
  lifetimePaid: number;
  payouts: Payout[];
}> {
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

export interface AdminPayment {
  id: string;
  amount: string;
  status: PaymentStatus;
  refundedAmount: string | null;
  refundReason: string | null;
  refundedAt: string | null;
}

export interface AdminIssueReport extends IssueReport {
  reporter: { id: string; name: string; email: string; role: "STUDENT" | "TUTOR" | "ADMIN" };
  booking: { id: string; subject: string; payment: AdminPayment | null } | null;
}

export function refundPayment(paymentId: string, data: { amount?: number; reason: string }): Promise<AdminPayment> {
  return apiFetch(`/payments/${paymentId}/refund`, { method: "POST", body: JSON.stringify(data) });
}

export interface AdminPaymentRow extends AdminPayment {
  method: string;
  createdAt: string;
  booking: {
    id: string;
    subject: string;
    scheduledAt: string;
    student: { id: string; name: string; email: string };
    tutor: { id: string; name: string; email: string };
  };
}

export function listAdminPayments(): Promise<AdminPaymentRow[]> {
  return apiFetch("/payments");
}

export function listAdminBookings(): Promise<Booking[]> {
  return apiFetch("/bookings/admin/list");
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  student: { id: string; name: string };
  tutor: { id: string; name: string };
  booking: { id: string; subject: string };
}

export function listAdminReviews(): Promise<AdminReview[]> {
  return apiFetch("/reviews/admin/list");
}

export function deleteAdminReview(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/reviews/${id}`, { method: "DELETE" });
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  admin: { id: string; name: string };
}

export function listAuditLog(): Promise<AuditLogEntry[]> {
  return apiFetch("/audit-log");
}

export interface AdminStats {
  revenue: { gross: number; refunded: number; net: number; platformFees: number };
  bookings: Record<BookingStatus, number> & { total: number };
  subscriptions: { plus: number; pro: number; totalActive: number };
  payouts: { pendingTotal: number; pendingCount: number };
}

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch("/dashboard/admin");
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
  // When the AI Helper count resets — the end of a short rolling window on
  // Free, or the monthly period end on Plus/Pro. Null on Free when no window
  // is currently active (i.e. nothing used yet).
  aiMessagesResetAt: string | null;
  generationsUsed: number;
  generationsLimit: number | null;
  canUseVision: boolean;
  maxFilesPerMessage: number;
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

export function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  return apiFetch("/auth/password", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) });
}

export function forgotPassword(email: string): Promise<{ success: boolean }> {
  return apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  return apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) });
}

export function deleteOwnAccount(): Promise<unknown> {
  return apiFetch("/users/me", { method: "DELETE" });
}
