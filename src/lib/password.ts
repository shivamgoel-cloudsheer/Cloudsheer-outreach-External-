import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { decideWorkspaceJoin, provisionWorkspaceJoin } from "@/lib/roles";

// Cold-email clients (any non-cloudsheer.com domain) sign in with their email
// as the user id plus a password. cloudsheer.com staff use Google instead, so
// password auth is refused for admin-domain addresses.

const BCRYPT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 8;

/** Thrown for expected, user-facing signup problems (shown back on the form). */
export class PasswordSignupError extends Error {}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, normalized));
  return user ?? null;
}

/**
 * Creates a password-based client account. The email is the user id. Refuses
 * admin-domain emails (those sign in with Google) and emails that already have
 * an account, so a Google-linked address can't be silently claimed by password.
 */
export async function createPasswordUser(
  email: string,
  password: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();

  if (isAdminEmail(normalized)) {
    throw new PasswordSignupError(
      "Cloudsheer accounts sign in with Google, not a password."
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new PasswordSignupError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  }
  if (await findUserByEmail(normalized)) {
    throw new PasswordSignupError(
      "An account with this email already exists. Log in instead."
    );
  }

  // Invite-only workspaces: the first user of a domain claims it as admin;
  // everyone else needs a pending invitation. Decide before creating the row.
  const decision = await decideWorkspaceJoin(normalized);
  if (!decision.allowed) {
    throw new PasswordSignupError(decision.reason ?? "You can't sign up yet.");
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({
      email: normalized,
      name: normalized.split("@")[0],
      passwordHash,
      role: decision.role,
    })
    .returning({ id: users.id });

  await provisionWorkspaceJoin(created.id, normalized, decision);
}
