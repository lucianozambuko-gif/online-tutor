"use client";

import { useEffect, useState } from "react";
import { listUsers, deleteUser, ApiError, type AdminUser } from "@/lib/api";
import { Card, ErrorText, StatusBadge, buttonClass } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(u: AdminUser) {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This deactivates their account.`)) return;
    setDeletingId(u.id);
    setError(null);
    try {
      await deleteUser(u.id);
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
