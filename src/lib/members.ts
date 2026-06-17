import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, invitations, workspaces } from "@/db/schema";
import { ROLE_LABEL, type Access, type Role } from "@/lib/roles";
import { getSenderAccount, hasSendScope, getAccessTokenForSender } from "@/lib/google";
import { sendGmail } from "@/lib/gmailSend";

export type Member = {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
};

/** Members of a domain workspace (users with a role; removed users excluded). */
export async function listMembers(domain: string): Promise<Member[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(
      and(
        eq(sql`lower(split_part(${users.email}, '@', 2))`, domain),
        isNotNull(users.role)
      )
    )
    .orderBy(users.email);
  return rows.map((r) => ({ ...r, role: r.role as Role }));
}

/** Pending (not accepted/revoked, not expired) invitations for a domain. */
export async function listPendingInvites(
  domain: string
): Promise<PendingInvite[]> {
  const rows = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      createdAt: invitations.createdAt,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(
      and(eq(invitations.domain, domain), eq(invitations.status, "pending"))
    )
    .orderBy(desc(invitations.createdAt));
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
  }));
}

/** All claimed workspaces with a member count (super-admin domain picker). */
export async function listWorkspaces(): Promise<
  { domain: string; name: string; members: number }[]
> {
  const rows = await db
    .select({
      domain: workspaces.domain,
      name: workspaces.name,
      members: sql<number>`(
        SELECT count(*)::int FROM "user" u
        WHERE lower(split_part(u.email, '@', 2)) = ${workspaces.domain}
          AND u.role IS NOT NULL
      )`,
    })
    .from(workspaces)
    .orderBy(workspaces.domain);
  return rows;
}

/**
 * The domain a viewer is allowed to manage members for:
 *   - super-admin: the requested domain (any), or null to pick one.
 *   - domain admin: always their own domain (requested is ignored).
 *   - anyone else: null (not allowed).
 */
export function manageableDomain(
  access: Access,
  requested?: string | null
): string | null {
  if (access.isSuperAdmin) {
    return requested?.trim().toLowerCase() || null;
  }
  if (access.role === "admin") return access.domain;
  return null;
}

/**
 * Emails the invite link through the inviting admin's own Gmail. Returns false
 * (so the caller can surface the link for manual sharing) when that mailbox
 * isn't connected with send permission.
 */
export async function sendInviteEmail(opts: {
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  role: Role;
  domain: string;
  link: string;
}): Promise<boolean> {
  const account = await getSenderAccount(opts.fromEmail);
  if (!account || !hasSendScope(account.scope)) return false;

  const token = await getAccessTokenForSender(opts.fromEmail);
  const roleLabel = ROLE_LABEL[opts.role];
  const subject = `You're invited to the ${opts.domain} workspace on Cloudsheer Outreach`;
  const text = [
    `You've been invited to join the ${opts.domain} workspace on Cloudsheer Outreach as "${roleLabel}".`,
    "",
    `Accept your invite and get started here:`,
    opts.link,
    "",
    `Sign in with ${opts.toEmail}. This link expires in 14 days.`,
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">
      <p>You've been invited to join the <strong>${opts.domain}</strong> workspace on
      Cloudsheer Outreach as <strong>${roleLabel}</strong>.</p>
      <p><a href="${opts.link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">Accept invite</a></p>
      <p style="color:#475569">Sign in with ${opts.toEmail}. This link expires in 14 days.</p>
    </div>`;

  await sendGmail({
    accessToken: token,
    fromName: opts.fromName,
    fromEmail: opts.fromEmail,
    to: opts.toEmail,
    subject,
    text,
    html,
  });
  return true;
}
