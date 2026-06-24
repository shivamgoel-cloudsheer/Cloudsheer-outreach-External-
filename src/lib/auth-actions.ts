"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  createPasswordUser,
  MIN_PASSWORD_LENGTH,
  PasswordSignupError,
} from "@/lib/password";

// State returned to the landing page forms via useActionState. On success the
// action redirects (signIn throws NEXT_REDIRECT), so a returned value always
// means an error to display.
export type AuthState = { error?: string } | undefined;

const DASHBOARD = "/dashboard";

function emailField(formData: FormData): string {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

export async function loginWithPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = emailField(formData);
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  if (isAdminEmail(email)) {
    return {
      error: "Cloudsheer accounts sign in with Google. Use the Google button.",
    };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: DASHBOARD });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Wrong email or password." };
    }
    throw error; // success redirect (NEXT_REDIRECT) and anything unexpected
  }
  return undefined;
}

export async function signupWithPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = emailField(formData);
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email.includes("@") || email.length < 3) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  try {
    await createPasswordUser(email, password);
  } catch (error) {
    if (error instanceof PasswordSignupError) return { error: error.message };
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirectTo: DASHBOARD });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created - please log in." };
    }
    throw error;
  }
  return undefined;
}

export async function signInWithGoogle(): Promise<void> {
  await signIn("google", { redirectTo: DASHBOARD });
}
