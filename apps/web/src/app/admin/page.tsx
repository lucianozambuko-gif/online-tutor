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
  listAllIssueReports,
  updateIssueReport,
  listAdminSubscriptions,
  ApiError,
  type AdminUser,
  type Payout,
  type AdminTutor,
  type AdminIssueReport,
  type IssueStatus,
  type AdminSubscription,
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

  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);

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

  function loadTutors() {
    listAdminTutors()
      .then(setTutors)
      .catch((err) => setTutorsError(err instanceof ApiError ? err.message : "Failed to load tutors"))
      .finally(() => setTutorsLoading(false));
  }

  useEffect(loadTutors, []);

  async function handleVerification(tutor: AdminTutor, status: "APPROVED" | "REJECTED") {
    if (status === "REJECTED" && !window.confirm(`Reject ${tutor.name} as a tutor? They won't be bookable.`)) return;
    setDecidingTutorId(tutor.id);
    setTutorsError(null);
    try {
      await setTutorVerification(tutor.id, status);
      setTutorsLoading(true);
      loadTutors();
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

  async function handleIssueUpdate(issue: AdminIssueReport, status: IssueStatus) {
    setUpdatingIssueId(issue.id);
    setIssuesError(null);
    try {
      await updateIssueReport(issue.id, { status, adminNotes: issueNotes[issue.id] ?? issue.adminNotes ?? undefined });
      setIssuesLoading(true);
      loadIssues();
    } catch (err) {
      setIssuesError(err instanceof ApiError ? err.message : "Failed to update this report");
    } finally {
      setUpdatingIssueId(null);
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
    } catch (err) {
      setPayoutError(err instanceof ApiError ? err.message : "Failed to run payout batch");
    } finally {
      setRunningPayout(false);
    }
  }

  async function handleMarkPaid(payout: Payout) {
    if (!window.confirm(`Mark the R${Number(payout.totalAmount).toFixed(2)} payout to ${payout.tutor?.name} as paid?`)) return;
    setMarkingPaidId(payout.id);
    setPayoutError(null);
    try {
      await markPayoutPaid(payout.id);
      setPayoutsLoading(true);
      loadPayouts();
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
                  </p>
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

        {issuesLoading ? (
          <p className="mt-4 text-sm text-ink-500">Loading issue reports...</p>
        ) : issues.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">Nothing reported yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {issues.map((issue) => {
              const busy = updatingIssueId === issue.id;
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
            {payouts.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-700/10 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{p.tutor?.name}</p>
                  <p className="text-xs text-ink-500">
                    {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
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
              </li>
            ))}
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
    </div>
  );
}
