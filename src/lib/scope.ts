import { inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";

/**
 * Campaign visibility and control.
 *
 * - cloudsheer.com admins see and manage EVERY campaign (no restriction).
 * - Everyone else is a client: they see and manage every campaign owned by a
 *   user that shares their email domain, so a whole client company works on its
 *   own campaigns together. Their login id is their email, and their teammates
 *   are simply the other users on the same domain.
 */
export type Viewer = { id: string; email?: string | null };

/** Lowercased domain part of an email, or null when there isn't one. */
export function emailDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  return at < 0 ? null : email.slice(at + 1).toLowerCase();
}

/**
 * The set of user ids whose campaigns this viewer may access.
 *   null  => admin: no restriction (every campaign)
 *   [ids] => client: every user on the viewer's domain (always incl. self)
 */
export async function visibleUserIds(
  viewer: Viewer
): Promise<string[] | null> {
  if (isAdminEmail(viewer.email)) return null;

  const domain = emailDomain(viewer.email);
  if (!domain) return [viewer.id];

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(split_part(${users.email}, '@', 2)) = ${domain}`);

  const ids = rows.map((r) => r.id);
  if (!ids.includes(viewer.id)) ids.push(viewer.id);
  return ids;
}

/**
 * Drizzle conditions restricting `campaigns` to what the viewer may access,
 * ready to spread into and(...). Empty for admins (no restriction).
 *
 *   const [campaign] = await db.select().from(campaigns)
 *     .where(and(eq(campaigns.id, id), ...(await campaignScope(session.user))));
 */
export async function campaignScope(viewer: Viewer): Promise<SQL[]> {
  const ids = await visibleUserIds(viewer);
  return ids === null ? [] : [inArray(campaigns.userId, ids)];
}

/**
 * Whether this viewer may send a campaign as the given mailbox. Admins
 * (cloudsheer.com) can send from any connected mailbox; a client may only send
 * from a mailbox on its own domain, so no tenant can send as another's address.
 */
export function canSendAs(
  viewer: Viewer,
  senderEmail: string | null | undefined
): boolean {
  if (isAdminEmail(viewer.email)) return true;
  const viewerDomain = emailDomain(viewer.email);
  const senderDomain = emailDomain(senderEmail);
  return !!viewerDomain && viewerDomain === senderDomain;
}
