import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalH2, LegalUl } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Lumen",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="13 October 2026">
      <p>
        Lumen Tutoring (&quot;Lumen&quot;, &quot;we&quot;, &quot;us&quot;) operates an online tutoring platform
        connecting students and tutors in South Africa. This policy explains what personal information we
        collect, why, and what rights you have over it under the Protection of Personal Information Act
        (POPIA).
      </p>
      <p className="rounded-lg border border-gold-400/30 bg-gold-300/10 p-4 text-sm">
        This is a working draft prepared for Lumen&apos;s launch. It has not yet been reviewed by an
        attorney. Please have it checked for completeness and accuracy before relying on it for a live,
        public product handling minors&apos; data and payments.
      </p>

      <LegalH2>Information we collect</LegalH2>
      <p>We collect the following categories of information:</p>
      <LegalUl>
        <li><strong>Account information:</strong> name, email address, password (stored as a salted hash, never in plain text), and account role (student, tutor, or admin).</li>
        <li><strong>Student information:</strong> date of birth, grade/institution type, and — for students under 18 — a parent or guardian&apos;s name and email, used solely to obtain and record consent.</li>
        <li><strong>Tutor information:</strong> subjects and grade levels taught, hourly rate, bio, bank details for payouts (bank name, account holder, account number, branch code, account type), and an optional transcript/qualification document uploaded for verification.</li>
        <li><strong>Booking and session information:</strong> scheduled session details, subject, duration, mode (online or in person), and — for online sessions — a generated video-call link.</li>
        <li><strong>Payment information:</strong> we do not store your card details. Payments are processed by PayFast (see &quot;Payment processing&quot; below); we retain only the resulting transaction records (amount, status, timestamps).</li>
        <li><strong>Content you create:</strong> AI-generated study notes, flashcards, and quizzes, and your messages (including any photos or documents you attach) to Lumen&apos;s AI study helper.</li>
        <li><strong>Reviews:</strong> ratings and written feedback students leave for tutors after a completed session.</li>
        <li><strong>Technical information:</strong> IP address (used transiently to rate-limit abusive requests, e.g. repeated failed logins) and a single authentication cookie used to keep you signed in.</li>
      </LegalUl>

      <LegalH2>Children&apos;s information and guardian consent</LegalH2>
      <p>
        Lumen is used by students under 18. Where POPIA requires it, we obtain a parent or guardian&apos;s
        consent before a minor&apos;s account is activated: we email the guardian a consent link, and the
        account remains inactive until they respond. A record of that consent (who, when, which version of
        this policy was in effect) is kept for accountability.
      </p>

      <LegalH2>How we use your information</LegalH2>
      <LegalUl>
        <li>To create and manage your account, and to verify tutors before they become bookable.</li>
        <li>To process bookings, payments, and tutor payouts.</li>
        <li>To generate AI study content and respond to your questions in the AI study helper.</li>
        <li>To send you account-related email (guardian consent requests, password resets).</li>
        <li>To investigate reported issues and enforce our Terms of Service.</li>
        <li>To meet our own legal, accounting, and tax obligations.</li>
      </LegalUl>
      <p>We do not sell your personal information, and we do not use it for third-party advertising.</p>

      <LegalH2>Who we share it with</LegalH2>
      <p>We share information with the following service providers, only as needed to run the platform:</p>
      <LegalUl>
        <li><strong>PayFast</strong> — processes booking and subscription payments.</li>
        <li><strong>Groq</strong> — processes the text (and any attached images/documents) you send to the AI study helper, and the topics you ask it to turn into notes, flashcards, or quizzes, in order to generate a response. Groq does not use API traffic to train its models.</li>
        <li><strong>Resend</strong> — sends transactional email on our behalf (guardian consent, password reset).</li>
        <li><strong>Neon</strong> and <strong>Render</strong> — host our database and backend application.</li>
        <li><strong>Vercel</strong> — hosts our website.</li>
      </LegalUl>
      <p>
        A tutor you book with sees the information needed to deliver your session (your name, the subject,
        and scheduling details). We do not share your contact details with a tutor beyond what&apos;s
        necessary for that session.
      </p>

      <LegalH2>Payment processing</LegalH2>
      <p>
        All payments are handled by PayFast, a licensed South African payment gateway. Lumen never receives
        or stores your full card number. Refunds for cancelled or disputed bookings are issued back through
        PayFast to your original payment method.
      </p>

      <LegalH2>Data retention</LegalH2>
      <p>
        We keep account and booking records for as long as your account is active, and for a reasonable
        period afterward to meet tax, accounting, and dispute-resolution obligations. If you delete your
        account, we deactivate it immediately and remove personal information we&apos;re not otherwise
        required to retain.
      </p>

      <LegalH2>Your rights under POPIA</LegalH2>
      <p>You have the right to:</p>
      <LegalUl>
        <li>Access the personal information we hold about you.</li>
        <li>Request correction of inaccurate or outdated information.</li>
        <li>Request deletion of your account and associated personal information, subject to our legal retention obligations.</li>
        <li>Object to processing of your information in certain circumstances.</li>
        <li>Lodge a complaint with South Africa&apos;s Information Regulator (<a href="https://inforegulator.org.za" className="text-sky-700 hover:text-sky-800" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>) if you believe we&apos;ve mishandled your information.</li>
      </LegalUl>
      <p>
        To exercise any of these rights, contact us using the details below, or use the account deletion
        option in your Lumen settings.
      </p>

      <LegalH2>Security</LegalH2>
      <p>
        Passwords are hashed, not stored in plain text. Access to administrative functions (tutor
        verification, payouts, refunds) is restricted to authenticated admin accounts, and sensitive admin
        actions are logged for accountability. No system is completely secure, and we encourage you to use a
        unique, strong password for your Lumen account.
      </p>

      <LegalH2>Cookies</LegalH2>
      <p>
        We use a single, strictly-necessary cookie to keep you signed in. We don&apos;t use advertising or
        third-party tracking cookies.
      </p>

      <LegalH2>Changes to this policy</LegalH2>
      <p>
        We may update this policy as the platform changes. We&apos;ll update the &quot;last updated&quot;
        date above, and for material changes, we&apos;ll make reasonable efforts to notify users directly.
      </p>

      <LegalH2>Contact us</LegalH2>
      <p>
        Questions about this policy or your personal information can be sent to{" "}
        <a href="mailto:lucianozambuko@gmail.com" className="text-sky-700 hover:text-sky-800">
          lucianozambuko@gmail.com
        </a>
        . See also our{" "}
        <Link href="/terms" className="text-sky-700 hover:text-sky-800">
          Terms of Service
        </Link>
        .
      </p>
    </LegalPage>
  );
}
