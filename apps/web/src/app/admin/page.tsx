"use client";

import { useEffect, useState } from "react";
import {
  listUsers,
  deleteUser,
  listAllPayouts,
  runPayoutBatch,
  markPayoutPaid,
  listAdminTutors,
  setTutorVerification,
  setTutorTranscriptVerified,
  listAllIssueReports,
  updateIssueReport,
  listAdminSubscriptions,
  refundPayment,
  markPaymentTestPaid,
  listAdminPayments,
  listAdminBookings,
  setBookingRecordingUrl,
  listAdminReviews,
  deleteAdminReview,
  listAuditLog,
  getAdminStats,
  listAdminFlaggedMessages,
  listAdminImprovementProofs,
  setImprovementProofVerified,
  ApiError,
  GRADE_LEVEL_LABELS,
  type AdminUser,
  type Payout,
  type AdminTutor,
  type AdminImprovementProof,
  type AdminIssueReport,
  type IssueStatus,
  type AdminSubscription,
  type AdminPayment,
  type AdminPaymentRow,
  type Booking,
  type AdminReview,
  type AuditLogEntry,
  type AdminStats,
  type AdminFlaggedMessage,
} from "@/lib/api";
import { Card, ErrorText, StatusBadge, buttonClass } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [runningPayout, setRunningPayout] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const [tutors, setTutors] = useState<AdminTutor[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [tutorsError, setTutorsError] = useState<string | null>(null);
  const [decidingTutorId, setDecidingTutorId] = useState<string | null>(null);

  const [issues, setIssues] = useState<AdminIssueReport[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);
  const [issueNotes, setIssueNotes] = useState<Record<string, string>>({});
  const [refundForms, setRefundForms] = useState<Record<string, { amount: string; reason: string }>>({});

  const [flaggedMessages, setFlaggedMessages] = useState<AdminFlaggedMessage[]>([]);
  const [flaggedMessagesLoading, setFlaggedMessagesLoading] = useState(true);
  const [flaggedMessagesError, setFlaggedMessagesError] = useState<string | null>(null);
  const [refundingPaymentId, setRefundingPaymentId] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [markingTestPaidId, setMarkingTestPaidId] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const [activity, setActivity] = useState<AuditLogEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [improvementProofs, setImprovementProofs] = useState<AdminImprovementProof[]>([]);
  const [improvementProofsLoading, setImprovementProofsLoading] = useState(true);
  const [improvementProofsError, setImprovementProofsError] = useState<string | null>(null);
  const [decidingProofId, setDecidingProofId] = useState<string | null>(null);

  function load() {
    listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }

  function loadPayouts() {
    listAllPayouts()
      .then(setPayouts)
      .catch((err) => setPayoutError(err instanceof ApiError ? err.message : "Failed to load payouts"))
      .finally(() => setPayoutsLoading(false));
  }

  useEffect(loadPayouts, []);

  useEffect(() => {
    listAdminSubscriptions()
      .then(setSubscriptions)
      .catch((err) => setSubscriptionsError(err instanceof ApiError ? err.message : "Failed to load subscriptions"))
      .finally(() => setSubscriptionsLoading(false));
  }, []);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setStatsError(err instanceof ApiError ? err.message : "Failed to load stats"));
  }, []);

  function loadPayments() {
    listAdminPayments()
      .then(setPayments)
      .catch((err) => setPaymentsError(err instanceof ApiError ? err.message : "Failed to load payments"))
      .finally(() => setPaymentsLoading(false));
  }

  useEffect(loadPayments, []);

  function loadBookings() {
    listAdminBookings()
      .then(setBookings)
      .catch((err) => setBookingsError(err instanceof ApiError ? err.message : "Failed to load bookings"))
      .finally(() => setBookingsLoading(false));
  }

  useEffect(loadBookings, []);

  const [settingRecordingId, setSettingRecordingId] = useState<string | null>(null);

  async function handleSetRecordingUrl(booking: Booking) {
    const url = window.prompt(
      `Test-only: paste a video URL to attach as the recording for "${booking.subject}". This simulates the real 8x8 recording webhook, which isn't wired up yet.`,
      booking.recordingUrl ?? "",
    );
    if (!url) return;
    setSettingRecordingId(booking.id);
    setBookingsError(null);
    try {
      await setBookingRecordingUrl(booking.id, url);
      setBookingsLoading(true);
      loadBookings();
    } catch (err) {
      setBookingsError(err instanceof ApiError ? err.message : "Failed to set recording URL");
    } finally {
      setSettingRecordingId(null);
    }
  }

  function loadReviews() {
    listAdminReviews()
      .then(setReviews)
      .catch((err) => setReviewsError(err instanceof ApiError ? err.message : "Failed to load reviews"))
      .finally(() => setReviewsLoading(false));
  }

  useEffect(loadReviews, []);

  function loadActivity() {
    listAuditLog()
      .then(setActivity)
      .catch((err) => setActivityError(err instanceof ApiError ? err.message : "Failed to load activity log"))
      .finally(() => setActivityLoading(false));
  }

  useEffect(loadActivity, []);

  function loadTutors() {
    listAdminTutors()
      .then(setTutors)
      .catch((err) => setTutorsError(err instanceof ApiError ? err.message : "Failed to load tutors"))
      .finally(() => setTutorsLoading(false));
  }

  useEffect(loadTutors, []);

  function loadImprovementProofs() {
    listAdminImprovementProofs()
      .then(setImprovementProofs)
      .catch((err) => setImprovementProofsError(err instanceof ApiError ? err.message : "Failed to load improvement proofs"))
      .finally(() => setImprovementProofsLoading(false));
  }

  useEffect(loadImprovementProofs, []);

  async function handleProofVerified(proof: AdminImprovementProof, verified: boolean) {
    setDecidingProofId(proof.id);
    setImprovementProofsError(null);
    try {
      await setImprovementProofVerified(proof.id, verified);
      setImprovementProofsLoading(true);
      loadImprovementProofs();
      loadActivity();
    } catch (err) {
      setImprovementProofsError(err instanceof ApiError ? err.message : "Failed to update this submission");
    } finally {
      setDecidingProofId(null);
    }
  }

  async function handleVerification(tutor: AdminTutor, status: "APPROVED" | "REJECTED") {
    if (status === "REJECTED" && !window.confirm(`Reject ${tutor.name} as a tutor? They won't be bookable.`)) return;
    setDecidingTutorId(tutor.id);
    setTutorsError(null);
    try {
      await setTutorVerification(tutor.id, status);
      setTutorsLoading(true);
      loadTutors();
      loadActivity();
    } catch (err) {
      setTutorsError(err instanceof ApiError ? err.message : "Failed to update this tutor");
    } finally {
      setDecidingTutorId(null);
    }
  }

  async function handleTranscriptVerified(tutor: AdminTutor, verified: boolean) {
    setDecidingTutorId(tutor.id);
    setTutorsError(null);
    try {
      await setTutorTranscriptVerified(tutor.id, verified);
      setTutorsLoading(true);
      loadTutors();
      loadActivity();
    } catch (err) {
      setTutorsError(err instanceof ApiError ? err.message : "Failed to update this tutor");
    } finally {
      setDecidingTutorId(null);
    }
  }

  function loadIssues() {
    listAllIssueReports()
      .then(setIssues)
      .catch((err) => setIssuesError(err instanceof ApiError ? err.message : "Failed to load issue reports"))
      .finally(() => setIssuesLoading(false));
  }

  useEffect(loadIssues, []);

  function loadFlaggedMessages() {
    listAdminFlaggedMessages()
      .then(setFlaggedMessages)
      .catch((err) => setFlaggedMessagesError(err instanceof ApiError ? err.message : "Failed to load flagged messages"))
      .finally(() => setFlaggedMessagesLoading(false));
  }

  useEffect(loadFlaggedMessages, []);

  async function handleIssueUpdate(issue: AdminIssueReport, status: IssueStatus) {
    setUpdatingIssueId(issue.id);
    setIssuesError(null);
    try {
      await updateIssueReport(issue.id, { status, adminNotes: issueNotes[issue.id] ?? issue.adminNotes ?? undefined });
      setIssuesLoading(true);
      loadIssues();
      loadActivity();
    } catch (err) {
      setIssuesError(err instanceof ApiError ? err.message : "Failed to update this report");
    } finally {
      setUpdatingIssueId(null);
    }
  }

  async function handleRefund(payment: AdminPayment) {
    const form = refundForms[payment.id] ?? { amount: "", reason: "" };
    if (!form.reason.trim()) {
      setRefundError("Enter a reason for the refund.");
      return;
    }
    const amountLabel = form.amount ? `R${form.amount}` : "the full remaining amount";
    if (!window.confirm(`Refund ${amountLabel} for this payment via PayFast?`)) return;

    setRefundingPaymentId(payment.id);
    setRefundError(null);
    try {
      await refundPayment(payment.id, {
        amount: form.amount ? Number(form.amount) : undefined,
        reason: form.reason.trim(),
      });
      setRefundForms((prev) => ({ ...prev, [payment.id]: { amount: "", reason: "" } }));
      setIssuesLoading(true);
      loadIssues();
      setPaymentsLoading(true);
      loadPayments();
      loadActivity();
    } catch (err) {
      setRefundError(err instanceof ApiError ? err.message : "Failed to process refund");
    } finally {
      setRefundingPaymentId(null);
    }
  }

  async function handleMarkTestPaid(payment: AdminPaymentRow) {
    if (
      !window.confirm(
        `Mark this R${payment.amount} payment as paid WITHOUT real money moving? Only use this for testing — it never shows up in the tutor's real payout.`,
      )
    ) {
      return;
    }
    setMarkingTestPaidId(payment.id);
    setRefundError(null);
    try {
      await markPaymentTestPaid(payment.id);
      setPaymentsLoading(true);
      loadPayments();
      loadActivity();
    } catch (err) {
      setRefundError(err instanceof ApiError ? err.message : "Failed to mark as paid");
    } finally {
      setMarkingTestPaidId(null);
    }
  }

  async function handleDeleteReview(review: AdminReview) {
    if (!window.confirm(`Delete this ${review.rating}-star review by ${review.student.name} of ${review.tutor.name}?`)) {
      return;
    }
    setDeletingReviewId(review.id);
    setReviewsError(null);
    try {
      await deleteAdminReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      loadActivity();
    } catch (err) {
      setReviewsError(err instanceof ApiError ? err.message : "Failed to delete review");
    } finally {
      setDeletingReviewId(null);
    }
  }

  async function handleRunPayout() {
    setRunningPayout(true);
    setPayoutError(null);
    try {
      const { created } = await runPayoutBatch();
      if (created.length === 0) {
        setPayoutError("No completed, paid sessions are waiting on a payout right now.");
      }
      setPayoutsLoading(true);
      loadPayouts();
      loadActivity();
    } catch (err) {
      setPayoutError(err instanceof ApiError ? err.message : "Failed to run payout batch");
    } finally {
      setRunningPayout(false);
    }
  }

  async function handleMarkPaid(payout: Payout) {
    if (
      !window.confirm(
        `Mark the R${Number(payout.totalAmount).toFixed(2)} payout to ${payout.tutor?.name} as paid? Reference: ${payout.reference ?? "none"}.`,
      )
    ) {
      return;
    }
    setMarkingPaidId(payout.id);
    setPayoutError(null);
    try {
      await markPayoutPaid(payout.id);
      setPayoutsLoading(true);
      loadPayouts();
      loadActivity();
    } catch (err) {
      setPayoutError(err instanceof ApiError ? err.message : "Failed to update payout");
    } finally {
      setMarkingPaidId(null);
    }
  }

  useEffect(load, []);

  async function handleDelete(u: AdminUser) {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This deactivates their account.`)) return;
    setDeletingId(u.id);
    setError(null);
    try {
      await deleteUser(u.id);
      setLoading(true);
      load();
      loadActivity();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  const activeUsers = users.filter((u) => u.status !== "DELETED");
  const counts = {
    students: activeUsers.filter((u) => u.role === "STUDENT").length,
    tutors: activeUsers.filter((u) => u.role === "TUTOR").length,
    admins: activeUsers.filter((u) => u.role === "ADMIN").length,
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
          Admin dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-500">An overview of everyone on the platform.</p>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Students", counts.students],
            ["Tutors", counts.tutors],
            ["Admins", counts.admins],
          ].map(([label, count]) => (
            <Card key={label} className="text-center">
              <p className="font-display text-3xl font-semibold text-ink-900">{count}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-ink-300">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {statsError && <ErrorText>{statsError}</ErrorText>}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <p className="font-display text-2xl font-semibold text-ink-900">R{stats.revenue.net.toFixed(2)}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink-300">Net revenue</p>
            <p className="mt-1 text-[11px] text-ink-300">
              R{stats.revenue.gross.toFixed(2)} gross · R{stats.revenue.refunded.toFixed(2)} refunded
            </p>
          </Card>
          <Card className="text-center">
            <p className="font-display text-2xl font-semibold text-ink-900">R{stats.revenue.platformFees.toFixed(2)}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink-300">Platform fees earned</p>
          </Card>
          <Card className="text-center">
            <p className="font-display text-2xl font-semibold text-ink-900">{stats.bookings.total}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink-300">Bookings</p>
            <p className="mt-1 text-[11px] text-ink-300">
              {stats.bookings.COMPLETED} completed · {stats.bookings.CONFIRMED} confirmed · {stats.bookings.PENDING} pending
            </p>
          </Card>
          <Card className="text-center">
            <p className="font-display text-2xl font-semibold text-ink-900">{stats.subscriptions.totalActive}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink-300">Active paid subscriptions</p>
            <p className="mt-1 text-[11px] text-ink-300">
              {stats.subscriptions.plus} Plus · {stats.subscriptions.pro} Pro
            </p>
          </Card>
        </div>
      )}

      <Card>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Tutor verification</h2>
          <p className="mt-1 text-sm text-ink-500">
            New tutors aren&apos;t bookable until you approve them here.
          </p>
        </div>

        {tutorsError && (
          <div className="mt-4">
            <ErrorText>{tutorsError}</ErrorText>
          </div>
        )}

        {tutorsLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading tutors...</p>
        ) : tutors.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No tutors have registered yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {[...tutors]
              .sort((a, b) => (a.tutorProfile.verificationStatus === b.tutorProfile.verificationStatus ? 0 : a.tutorProfile.verificationStatus === "PENDING" ? -1 : 1))
              .map((t) => (
                <li key={t.id} className="rounded-xl border border-ink-700/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{t.name}</p>
                      <p className="text-xs text-ink-500">{t.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={t.tutorProfile.verificationStatus} />
                      {t.tutorProfile.verificationStatus !== "APPROVED" && (
                        <button
                          type="button"
                          disabled={decidingTutorId === t.id}
                          onClick={() => handleVerification(t, "APPROVED")}
                          className={buttonClass("primary", "px-3 py-1.5 text-xs")}
                        >
                          Approve
                        </button>
                      )}
                      {t.tutorProfile.verificationStatus !== "REJECTED" && (
                        <button
                          type="button"
                          disabled={decidingTutorId === t.id}
                          onClick={() => handleVerification(t, "REJECTED")}
                          className={buttonClass("danger", "px-3 py-1.5 text-xs")}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink-300">
                    {t.tutorProfile.subjects.length > 0 ? t.tutorProfile.subjects.join(", ") : "No subjects listed"} · R
                    {Number(t.tutorProfile.hourlyRate).toFixed(0)}/hr
                    {t.tutorProfile.gradeLevels.length > 0 &&
                      ` · ${t.tutorProfile.gradeLevels.map((l) => GRADE_LEVEL_LABELS[l]).join(", ")}`}
                  </p>
                  {t.tutorProfile.transcriptName && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2.5 border-t border-ink-700/8 pt-2.5">
                      <a
                        href={`data:${t.tutorProfile.transcriptMimeType};base64,${t.tutorProfile.transcriptData}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-sky-700 hover:text-sky-600"
                      >
                        View transcript ({t.tutorProfile.transcriptName})
                      </a>
                      {t.tutorProfile.transcriptVerified ? (
                        <>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Verified</span>
                          <button
                            type="button"
                            disabled={decidingTutorId === t.id}
                            onClick={() => handleTranscriptVerified(t, false)}
                            className={buttonClass("ghost", "px-2.5 py-1 text-xs")}
                          >
                            Unmark
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={decidingTutorId === t.id}
                          onClick={() => handleTranscriptVerified(t, true)}
                          className={buttonClass("outline", "px-2.5 py-1 text-xs")}
                        >
                          Mark verified
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Improvement proofs</h2>
          <p className="mt-1 text-sm text-ink-500">
            Report cards tutors submitted as proof of a past student&apos;s improvement — private, never shown to
            students as documents, only as a verified subject/marks badge.
          </p>
        </div>

        {improvementProofsError && (
          <div className="mt-4">
            <ErrorText>{improvementProofsError}</ErrorText>
          </div>
        )}

        {improvementProofsLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading submissions...</p>
        ) : improvementProofs.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No submissions yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {improvementProofs.map((p) => (
              <li key={p.id} className="rounded-xl border border-ink-700/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {p.subject}: {p.beforeMark} → {p.afterMark}
                    </p>
                    <p className="text-xs text-ink-500">
                      {p.tutor.name} ({p.tutor.email}) · student: {p.studentName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.verified ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Verified</span>
                    ) : (
                      <span className="text-xs font-semibold text-gold-600">Pending</span>
                    )}
                    <a
                      href={`data:${p.documentMimeType};base64,${p.documentData}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-sky-700 hover:text-sky-600"
                    >
                      View document
                    </a>
                    {!p.verified ? (
                      <button
                        type="button"
                        disabled={decidingProofId === p.id}
                        onClick={() => handleProofVerified(p, true)}
                        className={buttonClass("primary", "px-3 py-1.5 text-xs")}
                      >
                        Verify
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={decidingProofId === p.id}
                        onClick={() => handleProofVerified(p, false)}
                        className={buttonClass("ghost", "px-3 py-1.5 text-xs")}
                      >
                        Unverify
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Reported issues</h2>
          <p className="mt-1 text-sm text-ink-500">Issues students and tutors have flagged.</p>
        </div>

        {issuesError && (
          <div className="mt-4">
            <ErrorText>{issuesError}</ErrorText>
          </div>
        )}
        {refundError && (
          <div className="mt-4">
            <ErrorText>{refundError}</ErrorText>
          </div>
        )}

        {issuesLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading issue reports...</p>
        ) : issues.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">Nothing reported yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {issues.map((issue) => {
              const busy = updatingIssueId === issue.id;
              const payment = issue.booking?.payment ?? null;
              const refundForm = payment ? (refundForms[payment.id] ?? { amount: "", reason: "" }) : null;
              return (
                <li key={issue.id} className="rounded-xl border border-ink-700/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{issue.subject}</p>
                      <p className="text-xs text-ink-500">
                        {issue.reporter.name} ({issue.reporter.role.toLowerCase()}) · {issue.category.toLowerCase()}
                      </p>
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="mt-2 text-sm text-ink-700">{issue.description}</p>
                  {payment && (
                    <div className="mt-3 rounded-lg border border-ink-700/10 bg-cream/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-ink-500">
                          Booking: {issue.booking?.subject} · R{payment.amount}
                        </p>
                        <StatusBadge status={payment.status} />
                      </div>
                      {payment.refundedAmount && (
                        <p className="mt-1 text-xs text-ink-300">
                          Refunded R{payment.refundedAmount} so far
                          {payment.refundReason ? ` — "${payment.refundReason}"` : ""}
                        </p>
                      )}
                      {(payment.status === "PAID" || payment.status === "PARTIALLY_REFUNDED") && refundForm && (
                        <div className="mt-2 flex flex-wrap items-end gap-2">
                          <div>
                            <label htmlFor={`refund-amount-${payment.id}`} className="block text-[11px] text-ink-300">
                              Amount (optional, full if blank)
                            </label>
                            <input
                              id={`refund-amount-${payment.id}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={refundForm.amount}
                              onChange={(e) =>
                                setRefundForms((prev) => ({
                                  ...prev,
                                  [payment.id]: { ...refundForm, amount: e.target.value },
                                }))
                              }
                              className="w-28 rounded-lg border border-ink-700/15 bg-white px-2 py-1.5 text-xs text-ink-900 outline-none focus:border-sky-400"
                            />
                          </div>
                          <div className="min-w-[160px] flex-1">
                            <label htmlFor={`refund-reason-${payment.id}`} className="block text-[11px] text-ink-300">
                              Reason
                            </label>
                            <input
                              id={`refund-reason-${payment.id}`}
                              type="text"
                              value={refundForm.reason}
                              onChange={(e) =>
                                setRefundForms((prev) => ({
                                  ...prev,
                                  [payment.id]: { ...refundForm, reason: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-ink-700/15 bg-white px-2 py-1.5 text-xs text-ink-900 outline-none focus:border-sky-400"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={refundingPaymentId === payment.id}
                            onClick={() => handleRefund(payment)}
                            className={buttonClass("danger", "px-3 py-1.5 text-xs")}
                          >
                            {refundingPaymentId === payment.id ? "Refunding..." : "Refund"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <textarea
                    value={issueNotes[issue.id] ?? issue.adminNotes ?? ""}
                    onChange={(e) => setIssueNotes((prev) => ({ ...prev, [issue.id]: e.target.value }))}
                    placeholder="Add a note for the reporter (optional)"
                    rows={2}
                    className="mt-3 w-full resize-y rounded-lg border border-ink-700/15 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {issue.status !== "UNDER_REVIEW" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleIssueUpdate(issue, "UNDER_REVIEW")}
                        className={buttonClass("outline", "px-3 py-1.5 text-xs")}
                      >
                        Mark under review
                      </button>
                    )}
                    {issue.status !== "RESOLVED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleIssueUpdate(issue, "RESOLVED")}
                        className={buttonClass("primary", "px-3 py-1.5 text-xs")}
                      >
                        Mark resolved
                      </button>
                    )}
                    {issue.status !== "REJECTED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleIssueUpdate(issue, "REJECTED")}
                        className={buttonClass("danger", "px-3 py-1.5 text-xs")}
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Flagged messages</h2>
          <p className="mt-1 text-sm text-ink-500">
            Messages a student or tutor has reported from their booking chat.
          </p>
        </div>

        {flaggedMessagesError && (
          <div className="mt-4">
            <ErrorText>{flaggedMessagesError}</ErrorText>
          </div>
        )}

        {flaggedMessagesLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading flagged messages...</p>
        ) : flaggedMessages.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">Nothing flagged.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {flaggedMessages.map((m) => {
              const other = m.conversation.participants.find((p) => p.user.id !== m.sender.id)?.user;
              return (
                <li key={m.id} className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-ink-500">
                      {m.sender.name} ({m.sender.role.toLowerCase()})
                      {other && <> &middot; chatting with {other.name} ({other.role.toLowerCase()})</>}
                    </p>
                    <span className="text-xs text-ink-300">{new Date(m.sentAt).toLocaleString()}</span>
                  </div>
                  {m.conversation.booking && (
                    <p className="mt-1 text-xs text-ink-300">
                      Booking: {m.conversation.booking.subject} &middot;{" "}
                      {new Date(m.conversation.booking.scheduledAt).toLocaleDateString()}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-ink-900">{m.body}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Payments</h2>
          <p className="mt-1 text-sm text-ink-500">Every booking payment on the platform — money coming in via PayFast.</p>
        </div>

        {paymentsError && (
          <div className="mt-4">
            <ErrorText>{paymentsError}</ErrorText>
          </div>
        )}

        {paymentsLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No payments yet.</p>
        ) : (
          <table className="mt-4 w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-ink-700/10 text-xs uppercase tracking-wide text-ink-300">
                <th className="py-2 pr-4 font-medium">Booking</th>
                <th className="py-2 pr-4 font-medium">Student</th>
                <th className="py-2 pr-4 font-medium">Tutor</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const form = refundForms[p.id] ?? { amount: "", reason: "" };
                const canRefund = p.status === "PAID" || p.status === "PARTIALLY_REFUNDED";
                return (
                  <tr key={p.id} className="border-b border-ink-700/5 align-top last:border-0">
                    <td className="py-3 pr-4 text-ink-900">{p.booking.subject}</td>
                    <td className="py-3 pr-4 text-ink-500">{p.booking.student.name}</td>
                    <td className="py-3 pr-4 text-ink-500">{p.booking.tutor.name}</td>
                    <td className="py-3 pr-4 font-medium text-ink-900">R{p.amount}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={p.status} />
                      {p.refundedAmount && (
                        <p className="mt-1 text-[11px] text-ink-300">Refunded R{p.refundedAmount}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-ink-500">{formatDate(p.createdAt)}</td>
                    <td className="py-3 pr-4">
                      {canRefund && (
                        <div className="flex flex-col gap-1.5">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Full amount"
                            value={form.amount}
                            onChange={(e) =>
                              setRefundForms((prev) => ({ ...prev, [p.id]: { ...form, amount: e.target.value } }))
                            }
                            className="w-28 rounded-lg border border-ink-700/15 bg-white px-2 py-1 text-xs text-ink-900 outline-none focus:border-sky-400"
                          />
                          <input
                            type="text"
                            placeholder="Reason"
                            value={form.reason}
                            onChange={(e) =>
                              setRefundForms((prev) => ({ ...prev, [p.id]: { ...form, reason: e.target.value } }))
                            }
                            className="w-36 rounded-lg border border-ink-700/15 bg-white px-2 py-1 text-xs text-ink-900 outline-none focus:border-sky-400"
                          />
                          <button
                            type="button"
                            disabled={refundingPaymentId === p.id}
                            onClick={() => handleRefund(p)}
                            className={buttonClass("danger", "px-2.5 py-1 text-xs")}
                          >
                            {refundingPaymentId === p.id ? "Refunding..." : "Refund"}
                          </button>
                        </div>
                      )}
                      {p.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={markingTestPaidId === p.id}
                          onClick={() => handleMarkTestPaid(p)}
                          title="Forces this payment to PAID without PayFast — testing only, never counted in the tutor's real payout."
                          className={buttonClass("outline", "px-2.5 py-1 text-xs")}
                        >
                          {markingTestPaidId === p.id ? "Marking..." : "Mark as paid (test)"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {refundError && (
          <div className="mt-3">
            <ErrorText>{refundError}</ErrorText>
          </div>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Bookings</h2>
          <p className="mt-1 text-sm text-ink-500">Every session booked on the platform, most recent first.</p>
        </div>

        {bookingsError && (
          <div className="mt-4">
            <ErrorText>{bookingsError}</ErrorText>
          </div>
        )}

        {bookingsLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No bookings yet.</p>
        ) : (
          <table className="mt-4 w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-ink-700/10 text-xs uppercase tracking-wide text-ink-300">
                <th className="py-2 pr-4 font-medium">Subject</th>
                <th className="py-2 pr-4 font-medium">Student</th>
                <th className="py-2 pr-4 font-medium">Tutor</th>
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Mode</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Recording</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-ink-700/5 last:border-0">
                  <td className="py-3 pr-4 text-ink-900">{b.subject}</td>
                  <td className="py-3 pr-4 text-ink-500">{b.student.name}</td>
                  <td className="py-3 pr-4 text-ink-500">{b.tutor.name}</td>
                  <td className="py-3 pr-4 text-ink-500">{new Date(b.scheduledAt).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-ink-500">{b.mode === "ONLINE" ? "Online" : "In person"}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-3 pr-4">
                    {b.mode === "ONLINE" && (
                      <div className="flex flex-col items-start gap-1">
                        {b.recordingUrl && <span className="text-xs text-emerald-600 dark:text-emerald-400">Set</span>}
                        <button
                          type="button"
                          disabled={settingRecordingId === b.id}
                          onClick={() => handleSetRecordingUrl(b)}
                          className={buttonClass("outline", "px-2.5 py-1 text-xs")}
                        >
                          {b.recordingUrl ? "Replace URL (test)" : "Set URL (test)"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Reviews</h2>
          <p className="mt-1 text-sm text-ink-500">Student feedback on tutors — remove anything inappropriate.</p>
        </div>

        {reviewsError && (
          <div className="mt-4">
            <ErrorText>{reviewsError}</ErrorText>
          </div>
        )}

        {reviewsLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No reviews yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-ink-700/10 p-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)} · {r.tutor.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    by {r.student.name} · {r.booking.subject} · {formatDate(r.createdAt)}
                  </p>
                  {r.comment && <p className="mt-1.5 text-sm text-ink-700">{r.comment}</p>}
                </div>
                <button
                  type="button"
                  disabled={deletingReviewId === r.id}
                  onClick={() => handleDeleteReview(r)}
                  className={buttonClass("danger", "px-3 py-1.5 text-xs")}
                >
                  {deletingReviewId === r.id ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Subscriptions</h2>
          <p className="mt-1 text-sm text-ink-500">Students currently on a paid plan.</p>
        </div>

        {subscriptionsError && (
          <div className="mt-4">
            <ErrorText>{subscriptionsError}</ErrorText>
          </div>
        )}

        {subscriptionsLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading subscriptions...</p>
        ) : subscriptions.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No students on a paid plan yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {subscriptions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-700/10 p-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">{s.student.name}</p>
                  <p className="text-xs text-ink-500">{s.student.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink-900">{s.plan}</span>
                  <StatusBadge status={s.status} />
                  {s.periodEnd && (
                    <span className="text-xs text-ink-300">until {formatDate(s.periodEnd)}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Payouts</h2>
            <p className="mt-1 text-sm text-ink-500">
              Batch every completed, paid session not yet paid out into a payout per tutor.
            </p>
          </div>
          <button type="button" disabled={runningPayout} onClick={handleRunPayout} className={buttonClass("primary")}>
            {runningPayout ? "Running..." : "Run payout batch"}
          </button>
        </div>

        {payoutError && (
          <div className="mt-4">
            <ErrorText>{payoutError}</ErrorText>
          </div>
        )}

        {payoutsLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading payouts...</p>
        ) : payouts.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No payouts yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {payouts.map((p) => {
              const bank = p.tutor?.tutorProfile;
              const hasBankDetails = bank && (bank.bankName || bank.accountNumber);
              return (
                <li key={p.id} className="rounded-xl border border-ink-700/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{p.tutor?.name}</p>
                      <p className="text-xs text-ink-500">
                        {formatDate(p.periodStart)} – {formatDate(p.periodEnd)} · {(p.totalMinutes / 60).toFixed(1)}{" "}
                        hours tutored
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-base font-semibold text-ink-900">
                        R{Number(p.totalAmount).toFixed(2)}
                      </span>
                      <StatusBadge status={p.status} />
                      {p.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={markingPaidId === p.id}
                          onClick={() => handleMarkPaid(p)}
                          className={buttonClass("outline", "px-3 py-1.5 text-xs")}
                        >
                          Mark paid
                        </button>
                      )}
                    </div>
                  </div>
                  {p.status === "PENDING" && (
                    <p className="mt-2 text-xs text-ink-300">
                      {hasBankDetails ? (
                        <>
                          Pay to: {bank.accountHolder || p.tutor?.name} · {bank.bankName} · Acc {bank.accountNumber}
                          {bank.branchCode ? ` · Branch ${bank.branchCode}` : ""}
                          {bank.accountType ? ` · ${bank.accountType === "SAVINGS" ? "Savings" : "Cheque/Current"}` : ""}
                        </>
                      ) : (
                        "This tutor hasn't added bank details yet — ask them to add these on their profile before paying out."
                      )}
                    </p>
                  )}
                  {p.reference && (
                    <p className="mt-1 text-xs text-ink-300">
                      {p.status === "PENDING" ? "Use as the EFT reference: " : "Reference: "}
                      <span className="font-mono font-semibold text-ink-500">{p.reference}</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="font-display text-lg font-semibold text-ink-900">All users</h2>
        {loading ? (
          <p className="mt-4 text-sm text-ink-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No users yet.</p>
        ) : (
          <table className="mt-4 w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-ink-700/10 text-xs uppercase tracking-wide text-ink-300">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Joined</th>
                <th className="py-2 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isDeleted = u.status === "DELETED";
                return (
                  <tr key={u.id} className="border-b border-ink-700/5 last:border-0">
                    <td className="py-3 pr-4 font-medium text-ink-900">{u.name}</td>
                    <td className="py-3 pr-4 text-ink-500">{u.email}</td>
                    <td className="py-3 pr-4 text-ink-500">{u.role.toLowerCase()}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 pr-4 text-ink-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      {!isSelf && !isDeleted && (
                        <button
                          type="button"
                          disabled={deletingId === u.id}
                          onClick={() => handleDelete(u)}
                          className={buttonClass("danger", "px-3 py-1.5 text-xs")}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Activity log</h2>
          <p className="mt-1 text-sm text-ink-500">Recent admin actions — refunds, payouts, verifications, deletions.</p>
        </div>

        {activityError && (
          <div className="mt-4">
            <ErrorText>{activityError}</ErrorText>
          </div>
        )}

        {activityLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading activity...</p>
        ) : activity.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No admin actions recorded yet.</p>
        ) : (
          <table className="mt-4 w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-ink-700/10 text-xs uppercase tracking-wide text-ink-300">
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 pr-4 font-medium">Target</th>
                <th className="py-2 pr-4 font-medium">Admin</th>
                <th className="py-2 pr-4 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id} className="border-b border-ink-700/5 last:border-0">
                  <td className="py-3 pr-4 font-medium text-ink-900">{a.action.replace(/_/g, " ")}</td>
                  <td className="py-3 pr-4 text-ink-500">
                    {a.targetType} · {a.targetId.slice(0, 8)}
                  </td>
                  <td className="py-3 pr-4 text-ink-500">{a.admin.name}</td>
                  <td className="py-3 pr-4 text-ink-500">{new Date(a.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
