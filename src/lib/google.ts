import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";

/**
 * Returns a valid Google access token for the user, refreshing it via the
 * stored refresh_token when it is expired or about to expire.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));

  if (!account?.access_token) {
    throw new Error("No Google account linked. Please sign in again.");
  }

  const expiresAtMs = (account.expires_at ?? 0) * 1000;
  const stillValid = expiresAtMs > Date.now() + 60_000;
  if (stillValid) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error(
      "Google session expired and no refresh token is stored. Please sign out and sign in again."
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const tokens = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !tokens.access_token) {
    throw new Error(
      `Failed to refresh Google token: ${tokens.error ?? response.status} ${
        tokens.error_description ?? ""
      }`.trim()
    );
  }

  await db
    .update(accounts)
    .set({
      access_token: tokens.access_token,
      expires_at: Math.floor(Date.now() / 1000 + (tokens.expires_in ?? 3600)),
      // Google may rotate the refresh token; keep the old one otherwise
      refresh_token: tokens.refresh_token ?? account.refresh_token,
    })
    .where(
      and(
        eq(accounts.provider, "google"),
        eq(accounts.providerAccountId, account.providerAccountId)
      )
    );

  return tokens.access_token;
}
