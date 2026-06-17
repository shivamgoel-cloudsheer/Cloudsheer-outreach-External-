import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";

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
      "CloudSheer accounts sign in with Google, not a password."
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

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({
    email: normalized,
    name: normalized.split("@")[0],
    passwordHash,
  });
}
