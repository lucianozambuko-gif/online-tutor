"use client";

import { useAuth } from "@/lib/auth-context";

export function PortalHeader({ title }: { title: string }) {
  const { user, loading, logout } = useAuth();

  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1>{title}</h1>
      {!loading && user && (
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span>
            {user.name} ({user.role})
          </span>
          <button type="button" onClick={() => logout()}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
