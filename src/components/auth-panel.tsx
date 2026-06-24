"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  loginWithPassword,
  signupWithPassword,
  signInWithGoogle,
  type AuthState,
} from "@/lib/auth-actions";

function GoogleMark() {
  return (
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
  );
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30";

const TAB_BASE =
  "flex-1 rounded-lg py-1.5 text-sm font-medium transition";

export function AuthPanel({
  defaultEmail,
  defaultMode = "login",
}: {
  defaultEmail?: string;
  defaultMode?: "login" | "signup";
} = {}) {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [loginState, loginAction, loginPending] = useActionState<
    AuthState,
    FormData
  >(loginWithPassword, undefined);
  const [signupState, signupAction, signupPending] = useActionState<
    AuthState,
    FormData
  >(signupWithPassword, undefined);

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;
  const pending = isLogin ? loginPending : signupPending;

  return (
    <div
      id="start"
      className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-lg shadow-slate-200/60 sm:scroll-mt-24"
    >
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`${TAB_BASE} ${
            isLogin
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`${TAB_BASE} ${
            !isLogin
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Sign up
        </button>
      </div>

      {/* Email + password form. key forces a remount on tab switch so the two
          forms keep separate field state. */}
      <form
        key={mode}
        action={isLogin ? loginAction : signupAction}
        className="mt-5 space-y-3"
      >
        <div>
          <label className="text-xs font-medium text-slate-600" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={defaultEmail}
            placeholder="you@company.com"
            className={`mt-1 ${INPUT_CLASS}`}
          />
        </div>
        <div>
          <label
            className="text-xs font-medium text-slate-600"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : 8}
            placeholder={isLogin ? "Your password" : "At least 8 characters"}
            className={`mt-1 ${INPUT_CLASS}`}
          />
        </div>
        {!isLogin && (
          <div>
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="confirm"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Re-enter your password"
              className={`mt-1 ${INPUT_CLASS}`}
            />
          </div>
        )}

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          {isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-2 text-center text-xs text-slate-400">
        {isLogin
          ? "New here? Choose Sign up above."
          : "Your email is your user id."}
      </p>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Google: for the Cloudsheer team, and how clients connect a mailbox. */}
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <GoogleMark />
          Continue with Google
        </button>
      </form>
      <p className="mt-2 text-center text-xs text-slate-400">
        Cloudsheer team signs in with Google.
      </p>
    </div>
  );
}
