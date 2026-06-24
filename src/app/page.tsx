import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  FileSpreadsheet,
  Inbox,
  ListChecks,
  MailCheck,
  MessageSquareReply,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/ui";
import { AuthPanel } from "@/components/auth-panel";

const HERO_POINTS = [
  "Sends from your own Gmail",
  "Personalized from your Google Sheet",
  "Auto-stops the moment someone replies",
];

const FEATURES = [
  {
    icon: Inbox,
    title: "Sent from your own inbox",
    text: "Every message goes out through your real Gmail, so it reads as a personal note and lands in the inbox - not a promotions tab. No third-party sending domains.",
    accent: "from-sky-500 to-indigo-600",
    span: "lg:col-span-2",
  },
  {
    icon: FileSpreadsheet,
    title: "Sheet-native",
    text: "Your Google Sheet is the source of truth. Pick a tab and columns and go - no CSV exports or imports.",
    accent: "from-emerald-500 to-teal-600",
    span: "",
  },
  {
    icon: CalendarClock,
    title: "Smart drip scheduling",
    text: "Send in business hours, in each recipient's own timezone, with daily caps and warm-up built in.",
    accent: "from-violet-500 to-fuchsia-600",
    span: "",
  },
  {
    icon: MessageSquareReply,
    title: "Reply-aware follow-ups",
    text: "Track replies and bounces, run multi-step sequences, and automatically stop following up the moment a recipient responds.",
    accent: "from-amber-500 to-orange-600",
    span: "lg:col-span-2",
  },
];

const STEPS = [
  {
    icon: FileSpreadsheet,
    title: "Connect a sheet",
    text: "Sign in, point Decipher OS at any Google Sheet, and pick the tab and columns to personalize with.",
  },
  {
    icon: ListChecks,
    title: "Write once, personalize all",
    text: "Compose your subject and body with {{placeholders}}. Add A/B variants and multi-step follow-ups when you need them.",
  },
  {
    icon: Send,
    title: "Send from your inbox",
    text: "Emails drip out through your own Gmail on schedule, in each recipient's timezone, and stop when they reply.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex-1 bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">
              Features
            </a>
            <a href="#how" className="transition hover:text-slate-900">
              How it works
            </a>
          </nav>
          <Link
            href="#start"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Log in
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated aurora background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora absolute -top-48 left-1/2 h-130 w-225 -translate-x-1/2 rounded-full bg-sky-300/40 blur-3xl" />
          <div className="aurora absolute -bottom-40 -left-20 h-100 w-150 rounded-full bg-indigo-300/40 blur-3xl [animation-delay:3s]" />
          <div className="aurora absolute -right-20 top-20 h-100 w-100 rounded-full bg-violet-300/30 blur-3xl [animation-delay:6s]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.05)_1px,transparent_0)] [background-size:22px_22px]" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.1fr_minmax(0,420px)]">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <span className="fade-up inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur">
              <Sparkles size={13} />
              Outreach, from your own inbox
            </span>
            <h1 className="fade-up mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl [animation-delay:80ms]">
              Your Google Sheet,
              <br className="hidden sm:block" /> turned into a campaign that{" "}
              <span className="bg-linear-to-br from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                sends from your inbox
              </span>
            </h1>
            <p className="fade-up mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-slate-600 lg:mx-0 lg:text-lg [animation-delay:160ms]">
              Decipher OS personalizes from a sheet and sends through your own
              Gmail - scheduled to each recipient&apos;s timezone, with replies
              and follow-ups handled for you.
            </p>

            <ul className="fade-up mx-auto mt-7 flex max-w-md flex-col gap-2.5 text-left text-sm text-slate-700 lg:mx-0 [animation-delay:240ms]">
              {HERO_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>

            <div className="fade-up mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 lg:justify-start [animation-delay:320ms]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-slate-400" />
                Limited, transparent Google access
              </span>
              <span className="flex items-center gap-1.5">
                <MailCheck size={14} className="text-slate-400" />
                Built for Google Workspace
              </span>
            </div>
          </div>

          {/* Auth card */}
          <div className="fade-up flex justify-center lg:justify-end [animation-delay:200ms]">
            <AuthPanel />
          </div>
        </div>
      </section>

      {/* Product mockup */}
      <section className="px-6 pb-8">
        <div className="fade-up mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-center text-xs text-slate-400 ring-1 ring-slate-200">
              www.decipheros.com/dashboard
            </div>
          </div>
          {/* Fake dashboard */}
          <div className="bg-slate-50/60 p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Send, label: "Emails sent", value: "1,284" },
                { icon: MessageSquareReply, label: "Reply rate", value: "12%" },
                { icon: BarChart3, label: "Opens", value: "41%" },
                { icon: Inbox, label: "Bounce", value: "0.4%" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <s.icon size={13} />
                    <span className="text-[11px]">{s.label}</span>
                  </div>
                  <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {[
                { name: "Q2 partner outreach", status: "sent", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", pct: 72 },
                { name: "Investor update - warm list", status: "scheduled", chip: "bg-amber-50 text-amber-700 ring-amber-200", pct: 30 },
                { name: "Design agencies - cold", status: "draft", chip: "bg-slate-100 text-slate-600 ring-slate-200", pct: 0 },
              ].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Send size={15} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {c.name}
                      </p>
                      <span
                        className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${c.chip}`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-teal-400 to-emerald-500"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to run cold outreach that lands
            </h2>
            <p className="mt-4 text-pretty text-slate-600">
              Personal sending, smart scheduling, and reply tracking - without
              leaving your own Gmail and Google Sheets.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 ${f.span}`}
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${f.accent} text-white shadow-lg shadow-slate-300/40 transition group-hover:scale-105`}
                >
                  <f.icon size={20} />
                </span>
                <p className="mt-4 text-base font-semibold text-slate-900">
                  {f.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="relative overflow-hidden border-y border-slate-200 bg-white px-6 py-20"
      >
        <div className="mx-auto max-w-5xl">
          <div className="fade-up text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to your first send
            </h2>
            <p className="mt-4 text-slate-600">
              No setup project. Sign in and you are running a campaign in
              minutes.
            </p>
          </div>
          <div className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* connecting line */}
            <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-linear-to-r from-transparent via-indigo-200 to-transparent sm:block" />
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center sm:text-left">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 sm:mx-0">
                  {i + 1}
                </div>
                <p className="mt-5 flex items-center justify-center gap-2 text-lg font-semibold text-slate-900 sm:justify-start">
                  <s.icon size={17} className="text-indigo-600" />
                  {s.title}
                </p>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600 sm:mx-0">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-6 py-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-indigo-900 to-indigo-700 px-8 py-16 text-center shadow-2xl shadow-indigo-500/20">
          <div className="pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Start your first campaign in minutes
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-indigo-100">
              Connect a sheet, write once, and send from the inbox your
              recipients already trust.
            </p>
            <Link
              href="#start"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-slate-900">
              Privacy Policy
            </a>
            <a href="/terms" className="transition hover:text-slate-900">
              Terms
            </a>
            <p>Tool by Cloudsheer Consulting.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
