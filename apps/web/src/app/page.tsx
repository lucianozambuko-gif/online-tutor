import Link from "next/link";
import { Reveal } from "@/components/reveal";

const FEATURES = [
  {
    title: "Verified tutors",
    body: "Every tutor is vetted before they can take a booking — qualifications, ID, and background checks on file.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z M9 12l2 2 4-4"
      />
    ),
  },
  {
    title: "Secure payments",
    body: "Book and pay in a few taps through PayFast. Funds are held until your session is confirmed complete.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8h18M3 8a2 2 0 012-2h14a2 2 0 012 2M3 8v9a2 2 0 002 2h14a2 2 0 002-2V8M7 15h4"
      />
    ),
  },
  {
    title: "Safeguarded messaging",
    body: "In-app chat is scoped to your booking and logged for safety — no unsolicited contact, ever.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      />
    ),
  },
  {
    title: "Learn offline",
    body: "Download notes and flashcards for the road — your progress syncs the moment you're back online.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
      />
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "Find your tutor",
    body: "Search by subject, grade, and price to find a tutor who fits — read their profile and rating first.",
  },
  {
    n: "02",
    title: "Book & pay securely",
    body: "Pick a time that works, pay through PayFast, and get confirmation the moment your tutor accepts.",
  },
  {
    n: "03",
    title: "Learn & grow",
    body: "Meet online or in person, message your tutor anytime, and track your progress after every session.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <Nav />
      <Hero />
      <FeatureStrip />
      <HowItWorks />
      <RoleSplit />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-700/5 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink-900">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600" />
          Lumen
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-500 md:flex">
          <a href="#features" className="transition-colors hover:text-ink-900">
            Why Lumen
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-ink-900">
            How it works
          </a>
          <a href="#tutors" className="transition-colors hover:text-ink-900">
            Become a tutor
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-cream shadow-sm transition-all hover:shadow-md hover:shadow-gold-500/20"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="animate-drift absolute -left-32 -top-24 h-96 w-96 rounded-full bg-sky-200/60 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-drift-slow absolute -right-24 top-32 h-80 w-80 rounded-full bg-gold-300/40 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,var(--color-ink-700)_1px,transparent_0)] opacity-[0.03] [background-size:28px_28px]"
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-white/70 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-gold-600 shadow-sm">
            Now booking across South Africa
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl md:text-6xl">
            Tutoring that feels{" "}
            <span className="bg-gradient-to-r from-sky-600 via-sky-400 to-gold-500 bg-clip-text text-transparent">
              effortless
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-ink-500">
            Lumen connects students with verified tutors for one-on-one learning — book in minutes,
            pay securely, and message safely, all in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-sky-600 to-sky-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition-transform hover:scale-[1.03]"
            >
              Find a tutor
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-ink-700/15 bg-white/70 px-7 py-3.5 text-sm font-semibold text-ink-700 backdrop-blur-sm transition-all hover:border-gold-400/50 hover:text-ink-900"
            >
              Become a tutor
            </Link>
          </div>
        </Reveal>

        <Reveal delay={150} className="mx-auto mt-16 max-w-3xl">
          <dl className="grid grid-cols-3 divide-x divide-ink-700/10 rounded-2xl border border-ink-700/10 bg-white/60 py-6 text-center shadow-sm backdrop-blur-sm">
            {[
              ["100%", "Vetted tutors"],
              ["POPIA", "Compliant by design"],
              ["24/7", "Booking availability"],
            ].map(([stat, label]) => (
              <div key={label} className="px-4">
                <dt className="font-display text-2xl font-semibold text-ink-900">{stat}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wide text-ink-300">{label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureStrip() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Built for trust, from day one
        </h2>
        <p className="mt-4 text-ink-500">
          Every part of Lumen is designed around one idea: learning should feel safe, simple, and
          worth showing up for.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 80}>
            <div className="group h-full rounded-2xl border border-ink-700/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-lg hover:shadow-ink-900/5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 transition-colors group-hover:from-gold-300/30 group-hover:to-gold-300/10 group-hover:text-gold-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5.5 w-5.5">
                  {f.icon}
                </svg>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Three steps to your first session
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-ink-700/15 to-transparent md:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100} className="relative text-center md:text-left">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/50 bg-cream font-display text-sm font-semibold text-gold-600 md:mx-0">
                {s.n}
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoleSplit() {
  return (
    <section id="tutors" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-sky-600 to-sky-700 p-8 text-white shadow-xl shadow-sky-700/20 md:p-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-100/80">
                For students
              </span>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                Find the right tutor, right away
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-sky-50/90">
                Browse by subject and price, book in a few taps, and keep every session and note in
                one place — even offline.
              </p>
            </div>
            <Link
              href="/register"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-sky-700 transition-transform hover:scale-[1.03]"
            >
              Start learning
            </Link>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="flex h-full flex-col justify-between rounded-3xl border border-gold-400/30 bg-gradient-to-br from-ink-900 to-ink-700 p-8 text-cream shadow-xl shadow-ink-900/10 md:p-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gold-400">
                For tutors
              </span>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                Turn your expertise into income
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-cream/80">
                Set your own rate and availability, get paid securely through PayFast, and build a
                track record with every review.
              </p>
            </div>
            <Link
              href="/register"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-6 py-3 text-sm font-semibold text-ink-900 transition-transform hover:scale-[1.03]"
            >
              Apply to tutor
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-ink-700/10 bg-white px-8 py-16 text-center shadow-sm md:py-20">
          <div
            aria-hidden
            className="animate-drift absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-200/50 to-gold-300/30 blur-3xl"
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Ready when you are.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-ink-500">
              Create your free account and book your first session in minutes.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition-transform hover:scale-[1.03]"
            >
              Get started for free
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-700/10 bg-cream-soft">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-300 sm:flex-row">
        <div className="flex items-center gap-2 font-display font-semibold text-ink-700">
          <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-br from-gold-400 to-gold-600" />
          Lumen
        </div>
        <p>&copy; {new Date().getFullYear()} Lumen Tutoring. All rights reserved.</p>
      </div>
    </footer>
  );
}
