import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  FileSpreadsheet,
  Inbox,
  MessageSquareReply,
  ListChecks,
  Send,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/ui";
import { AuthPanel } from "@/components/auth-panel";

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: "Sheet-native",
    text: "Your Google Sheet is the source of truth. No CSV exports, no imports - pick a tab and columns and go.",
  },
  {
    icon: Inbox,
    title: "Sent from your inbox",
    text: "Emails go out through your own Gmail, so they read as personal and land in the inbox - not a promo tab.",
  },
  {
    icon: CalendarClock,
    title: "Smart scheduling",
    text: "Drip-send in business hours, in each recipient's own timezone, with daily limits and warm-up built in.",
  },
  {
    icon: MessageSquareReply,
    title: "Reply-focused",
    text: "Track replies and bounces, run multi-step follow-ups, and auto-stop the moment someone responds.",
  },
];

const STEPS = [
  {
    n: "1",
    icon: FileSpreadsheet,
    title: "Connect a sheet",
    text: "Sign in with Google and point the tool at any Google Sheet. Choose the tab and the columns you want to personalize with.",
  },
  {
    n: "2",
    icon: ListChecks,
    title: "Write once, personalize all",
    text: "Compose your subject and body with {{placeholders}}. Add A/B variants and multi-step follow-ups when you need them.",
  },
  {
    n: "3",
    icon: Send,
    title: "Send from your inbox",
    text: "Emails drip out through your own Gmail on a schedule, in each recipient's timezone, and stop the moment someone replies.",
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
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <Link
            href="#start"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Log in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:pt-28">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-130 w-225 -translate-x-1/2 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-60 left-1/4 h-100 w-150 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Cold email, from your own inbox
          </p>
          <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Your Google Sheet, turned into a personalized campaign
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-slate-600">
            Point at a sheet, personalize with placeholders, and send from your
            own Gmail - scheduled to each recipient&apos;s timezone, with replies
            and follow-ups handled for you.
          </p>
          <div className="mt-9 flex w-full justify-center">
            <AuthPanel />
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={13} className="text-slate-400" />
            Access is limited to what the tool needs: reading and updating the
            Google Sheet you pick, sending from your own Gmail, and reading your
            inbox to detect replies. Nothing more.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <f.icon size={18} className="text-indigo-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {f.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Three steps to your first send
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              No setup project. Sign in and you are running a campaign in
              minutes.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {s.n}
                </div>
                <p className="mt-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <s.icon size={16} className="text-indigo-600" />
                  {s.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-center">
            <Link
              href="#start"
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-br from-sky-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
            >
              <Send size={16} />
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-slate-900">
              Privacy Policy
            </a>
            <a href="/terms" className="transition hover:text-slate-900">
              Terms
            </a>
            <p>Tool by CloudSheer Consulting.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
