import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-ink-700/15 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30";

export const labelClass = "block text-sm font-medium text-ink-700";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-300">{hint}</p>}
    </div>
  );
}

type ButtonVariant = "primary" | "gold" | "outline" | "ghost" | "danger";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm hover:shadow-md hover:shadow-sky-600/20",
  gold: "bg-gradient-to-r from-gold-400 to-gold-600 text-ink-900 shadow-sm hover:shadow-md hover:shadow-gold-500/20",
  outline: "border border-ink-700/15 bg-white text-ink-700 hover:border-sky-400/50 hover:text-ink-900",
  ghost: "text-ink-500 hover:bg-ink-700/5 hover:text-ink-900",
  danger: "border border-red-300 bg-white text-red-600 hover:bg-red-50",
};

export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  return `inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ink-700/10 bg-white p-6 shadow-sm sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {children}
    </p>
  );
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gold-300/25 text-gold-600",
  PENDING_GUARDIAN_CONSENT: "bg-gold-300/25 text-gold-600",
  CONFIRMED: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-ink-700/8 text-ink-500",
  FAILED: "bg-red-100 text-red-700",
  DISPUTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        STATUS_STYLE[status] ?? "bg-ink-700/8 text-ink-500"
      }`}
    >
      {status.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
