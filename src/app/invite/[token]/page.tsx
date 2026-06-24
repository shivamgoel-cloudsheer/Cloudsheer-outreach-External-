import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MailCheck, ShieldX } from "lucide-react";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { auth } from "@/auth";
import { Logo } from "@/components/ui";
import { AuthPanel } from "@/components/auth-panel";
import { ROLE_LABEL } from "@/lib/roles";

export const dynamic = "force-dynamic";

// Module-scope (not the component body) so the time check stays out of render.
async function loadInvite(token: string) {
  const [invite] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token));
  if (!invite) return null;
  const valid =
    invite.status === "pending" && invite.expiresAt.getTime() > Date.now();
  return { invite, valid };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Already signed in: the invite is consumed automatically on sign-in, so
  // there's nothing to do here.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const result = await loadInvite(token);
  const invite = result?.invite;
  const invalid = !result?.valid;

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Logo size="lg" />
      </div>

      {invalid || !invite ? (
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ShieldX size={22} />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            This invite isn&apos;t valid
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            It may have expired, been revoked, or already been used. Ask your
            workspace admin to send a new one.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-sm">
          <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 ring-1 ring-indigo-200">
              <MailCheck size={18} />
            </div>
            <p className="mt-3 text-sm text-slate-700">
              You&apos;re invited to the{" "}
              <strong className="font-semibold text-slate-900">
                {invite.domain}
              </strong>{" "}
              workspace as{" "}
              <strong className="font-semibold text-slate-900">
                {ROLE_LABEL[invite.role]}
              </strong>
              .
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sign up or sign in with {invite.email} to accept.
            </p>
          </div>
          <AuthPanel defaultEmail={invite.email} defaultMode="signup" />
        </div>
      )}
    </main>
  );
}
