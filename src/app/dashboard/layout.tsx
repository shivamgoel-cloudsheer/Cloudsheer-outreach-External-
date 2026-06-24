import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut, AlertTriangle, Link2, ShieldX } from "lucide-react";
import { auth, signIn, signOut } from "@/auth";
import { Logo } from "@/components/ui";
import { getSenderAccount, hasSendScope } from "@/lib/google";
import { getAccess } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const access = await getAccess(session);

  // A signed-in user with no role and no super-admin status was removed from
  // their workspace (or never provisioned). Show a dead-end with sign-out
  // rather than redirecting (the landing page would bounce them back here).
  if (!access.isSuperAdmin && !access.role) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ShieldX size={22} />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            No workspace access
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Your access to this workspace has been removed. Ask an admin to
            invite you again.
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Sending goes through each sender's own Gmail. Only members who can send
  // (admin/editor) need Google connected; viewers/analysts don't.
  const ownAccount = session.user.email
    ? await getSenderAccount(session.user.email)
    : null;
  const needsConnect = !ownAccount && access.can.sendCampaigns;
  const needsRelink = !!ownAccount && !hasSendScope(ownAccount.scope);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              {access.can.viewCampaigns && (
                <Link
                  href="/dashboard"
                  className="text-slate-500 transition hover:text-slate-900"
                >
                  Campaigns
                </Link>
              )}
              {access.can.viewAnalytics && (
                <Link
                  href="/dashboard/analytics"
                  className="text-slate-500 transition hover:text-slate-900"
                >
                  Analytics
                </Link>
              )}
              {access.can.editCampaigns && (
                <Link
                  href="/dashboard/senders"
                  className="text-slate-500 transition hover:text-slate-900"
                >
                  Mailboxes
                </Link>
              )}
              {access.can.manageMembers && (
                <Link
                  href="/dashboard/members"
                  className="text-slate-500 transition hover:text-slate-900"
                >
                  Team
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full ring-1 ring-slate-200"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                  {(session.user.name ?? session.user.email ?? "?")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
              <span className="text-xs text-slate-500">
                {session.user.email}
              </span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                title="Sign out"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {needsConnect && (
        <div className="border-b border-indigo-200 bg-indigo-50">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-2.5">
            <p className="flex items-center gap-2 text-xs text-indigo-800">
              <Link2 size={14} className="shrink-0" />
              Connect your Google account to send campaigns from your own Gmail
              and read your Google Sheets.
            </p>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-800 transition hover:bg-indigo-100"
              >
                Connect Google
              </button>
            </form>
          </div>
        </div>
      )}
      {needsRelink && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-2.5">
            <p className="flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="shrink-0" />
              Sending now goes through your own Gmail. Re-connect Google to
              grant send access.
            </p>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
              >
                Re-connect Google
              </button>
            </form>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
