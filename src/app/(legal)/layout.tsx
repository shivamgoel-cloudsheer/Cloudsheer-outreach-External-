import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui";

// Shared chrome for the public legal pages (/privacy, /terms). The parentheses
// make this a route group, so it wraps the pages without adding a URL segment.
// Plain semantic HTML in each page is styled via the descendant selectors below,
// which keeps the page files focused on content.
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex-1 bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div className="[&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-600 [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:leading-relaxed [&_ul]:text-slate-600 [&_li]:list-disc [&_a]:font-medium [&_a]:text-indigo-600 [&_a]:underline [&_strong]:font-semibold [&_strong]:text-slate-800">
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <p>Tool by CloudSheer Consulting. Built for Google Workspace.</p>
        </div>
      </footer>
    </div>
  );
}
