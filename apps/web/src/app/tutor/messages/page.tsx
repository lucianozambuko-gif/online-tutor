"use client";

import Link from "next/link";
import { AdminContactChat } from "@/components/admin-contact-chat";

export default function TutorMessagesPage() {
  return (
    <div>
      <Link href="/tutor" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to dashboard
      </Link>
      <div className="mt-4">
        <AdminContactChat />
      </div>
    </div>
  );
}
