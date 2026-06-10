import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { GATE_COOKIE, gateToken } from "@/lib/gate";
import { Logo } from "@/components/ui";

async function unlock(formData: FormData) {
  "use server";

  const password = formData.get("password");
  if (
    typeof password !== "string" ||
    !process.env.ACCESS_PASSWORD ||
    password !== process.env.ACCESS_PASSWORD
  ) {
    redirect("/gate?error=1");
  }

  (await cookies()).set(GATE_COOKIE, gateToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  redirect("/");
}

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-neutral-950 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-white">
          CloudSheer Outreach
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          This tool is for the CloudSheer team. Enter the access password.
        </p>

        <form action={unlock} className="mt-6 space-y-3">
          <input
            type="password"
            name="password"
            autoFocus
            placeholder="Access password"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-center text-sm text-neutral-100 placeholder-neutral-600 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
          {error && (
            <p className="text-xs text-red-400">
              Wrong password. Try again.
            </p>
          )}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110"
          >
            <Lock size={14} />
            Unlock
          </button>
        </form>
      </div>
    </main>
  );
}
