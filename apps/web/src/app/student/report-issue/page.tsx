"use client";

import { useState } from "react";
import { ReportIssueForm } from "@/components/report-issue-form";
import { MyIssueReports } from "@/components/my-issue-reports";

export default function StudentReportIssuePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Report an issue</h1>
        <p className="mt-1 text-sm text-ink-500">
          Something wrong with a booking, payment, or the app itself? Let us know.
        </p>
      </div>
      <ReportIssueForm onCreated={() => setRefreshKey((k) => k + 1)} />
      <MyIssueReports refreshKey={refreshKey} />
    </div>
  );
}
