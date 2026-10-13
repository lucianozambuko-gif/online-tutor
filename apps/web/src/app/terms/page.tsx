import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalH2, LegalUl } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Lumen",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="13 October 2026">
      <p>
        These terms govern your use of Lumen, a platform connecting students with independent tutors in
        South Africa. By creating an account, you agree to these terms.
      </p>
      <p className="rounded-lg border border-gold-400/30 bg-gold-300/10 p-4 text-sm">
        This is a working draft prepared for Lumen&apos;s launch. It has not yet been reviewed by an
        attorney. Please have it checked before relying on it for a live, public product.
      </p>

      <LegalH2>Eligibility and accounts</LegalH2>
      <p>
        You must provide accurate information when registering. Students under 18 may only use Lumen once a
        parent or guardian has given consent through the process described in our{" "}
        <Link href="/privacy" className="text-sky-700 hover:text-sky-800">Privacy Policy</Link>. You&apos;re
        responsible for keeping your account credentials confidential and for all activity under your
        account.
      </p>

      <LegalH2>What Lumen is — and isn&apos;t</LegalH2>
      <p>
        Lumen is a marketplace that lets students find and book independent tutors, and provides AI-powered
        study tools (notes, flashcards, quizzes, and a study-helper chat). Tutors are independent contractors,
        not Lumen employees — Lumen is not a party to the tutoring relationship itself and doesn&apos;t
        guarantee the quality, accuracy, or outcome of any tutoring session.
      </p>

      <LegalH2>Tutor verification</LegalH2>
      <p>
        Tutors go through an admin review before their profile becomes bookable, and may optionally submit a
        transcript or qualification document for additional verification. Verification reduces risk but is
        not a guarantee of a tutor&apos;s qualifications, conduct, or suitability — use your own judgment,
        and report any concerns through the &quot;Report an issue&quot; feature in your account.
      </p>

      <LegalH2>Bookings, payments, and refunds</LegalH2>
      <LegalUl>
        <li>Session payments are processed through PayFast at the time of booking.</li>
        <li>Lumen takes a commission from each completed, paid session; tutors receive the remainder via periodic payout.</li>
        <li>If a tutor declines or cancels a confirmed booking, or an admin approves a refund request, the payment is refunded through PayFast to your original payment method.</li>
        <li>Disputes about a session&apos;s quality or conduct should be raised via &quot;Report an issue&quot; so an admin can review it.</li>
      </LegalUl>

      <LegalH2>AI-generated content</LegalH2>
      <p>
        Notes, flashcards, quizzes, and responses from the AI study helper are generated automatically and
        can be incomplete or incorrect. They&apos;re a study aid, not a substitute for your tutor, your
        teacher, or your own judgement — always verify anything important before relying on it.
      </p>

      <LegalH2>Acceptable use</LegalH2>
      <p>You agree not to:</p>
      <LegalUl>
        <li>Use Lumen for any unlawful purpose, or to harass, abuse, or endanger another user — including any minor on the platform.</li>
        <li>Attempt to bypass Lumen&apos;s payment system to transact with a tutor or student outside the platform.</li>
        <li>Misrepresent your identity, age, or qualifications.</li>
        <li>Attempt to disrupt, overload, or gain unauthorised access to the platform or another user&apos;s account.</li>
      </LegalUl>

      <LegalH2>Account suspension and termination</LegalH2>
      <p>
        We may suspend or terminate an account that violates these terms, poses a safety risk — particularly
        to a minor — or is used fraudulently. You may delete your own account at any time from your account
        settings.
      </p>

      <LegalH2>Limitation of liability</LegalH2>
      <p>
        Lumen is provided &quot;as is.&quot; To the fullest extent permitted by law, Lumen is not liable for
        indirect, incidental, or consequential damages arising from your use of the platform, the conduct of
        another user, or reliance on AI-generated content. Nothing in these terms limits liability that
        cannot be excluded under South African law.
      </p>

      <LegalH2>Changes to these terms</LegalH2>
      <p>
        We may update these terms as the platform changes. We&apos;ll update the &quot;last updated&quot;
        date above, and for material changes, we&apos;ll make reasonable efforts to notify users directly.
      </p>

      <LegalH2>Governing law</LegalH2>
      <p>These terms are governed by the laws of the Republic of South Africa.</p>

      <LegalH2>Contact us</LegalH2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href="mailto:lucianozambuko@gmail.com" className="text-sky-700 hover:text-sky-800">
          lucianozambuko@gmail.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
