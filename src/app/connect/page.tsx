import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Logo } from "@/components/ui";

export const dynamic = "force-dynamic";

// Shown right after an email/password login. The app needs Gmail + Sheets
// access to function, so we always route the user through the Google OAuth
// consent screen here - this guarantees the consent flow is presented even
// when signing in with a password (e.g. for the Google verification review).
export default async function ConnectPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Connect your Google account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Decipher OS sends and tracks email through your own Gmail and reads
          your Google Sheet of contacts. Continue to review and grant these
          permissions.
        </p>
        <form
          action={async () => {
            "use server";
            // The Google provider is configured with prompt:"consent", so this
            // always shows the full OAuth consent screen with the requested
            // Gmail + Sheets scopes before any access is granted.
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
              />
              <path
                fill="#FF3D00"
                d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
              />
            </svg>
            Continue with Google
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          You&apos;ll be asked to grant Gmail (send &amp; read) and Google
          Sheets access.
        </p>
      </div>
    </main>
  );
}
