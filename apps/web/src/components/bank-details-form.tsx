"use client";

import { useState, type FormEvent } from "react";
import { updateOwnTutorProfile, ApiError, type BankAccountType, type OwnTutorProfile } from "@/lib/api";
import { Card, Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

export function BankDetailsForm({ initial }: { initial: OwnTutorProfile }) {
  const [bankName, setBankName] = useState(initial.bankName ?? "");
  const [accountHolder, setAccountHolder] = useState(initial.accountHolder ?? "");
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber ?? "");
  const [branchCode, setBranchCode] = useState(initial.branchCode ?? "");
  const [accountType, setAccountType] = useState<BankAccountType | "">(initial.accountType ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await updateOwnTutorProfile({
        bankName: bankName || undefined,
        accountHolder: accountHolder || undefined,
        accountNumber: accountNumber || undefined,
        branchCode: branchCode || undefined,
        accountType: accountType || undefined,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Payout bank details</h2>
      <p className="mt-1 text-sm text-ink-500">
        Where an admin sends your payout by EFT. Lumen doesn&apos;t move money automatically yet — this just makes
        sure the right details are on hand when it&apos;s time to pay you.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Bank name" htmlFor="bankName">
          <input id="bankName" className={inputClass} value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </Field>
        <Field label="Account holder" htmlFor="accountHolder">
          <input
            id="accountHolder"
            className={inputClass}
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
          />
        </Field>
        <Field label="Account number" htmlFor="accountNumber">
          <input
            id="accountNumber"
            className={inputClass}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </Field>
        <Field label="Branch code" htmlFor="branchCode">
          <input id="branchCode" className={inputClass} value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
        </Field>
        <Field label="Account type" htmlFor="accountType">
          <select
            id="accountType"
            className={inputClass}
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as BankAccountType | "")}
          >
            <option value="">Select...</option>
            <option value="SAVINGS">Savings</option>
            <option value="CHEQUE">Cheque / Current</option>
          </select>
        </Field>

        {error && (
          <div className="sm:col-span-2">
            <ErrorText>{error}</ErrorText>
          </div>
        )}

        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={submitting} className={buttonClass("primary")}>
            {submitting ? "Saving..." : "Save bank details"}
          </button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</span>}
        </div>
      </form>
    </Card>
  );
}
