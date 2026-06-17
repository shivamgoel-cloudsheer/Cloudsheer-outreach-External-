import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaces, invitations } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { emailDomain } from "@/lib/scope";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/roleLabels";

export { ROLES, ROLE_LABEL, type Role };

export type Capabilities = {
  /** Invite/remove members and change roles. */
  manageMembers: boolean;
  /** Create, edit, delete campaigns, steps, recipients, schedules. */
  editCampaigns: boolean;
  /** Start/schedule/cancel sends (editors can send). */
  sendCampaigns: boolean;
  /** Open the campaign list and campaign detail (analyst excluded). */
  viewCampaigns: boolean;
  /** Open the analytics page (every role, including analyst). */
  viewAnalytics: boolean;
};

export type Access = {
  userId: string;
  email: string | null;
  domain: string | null;
  isSuperAdmin: boolean;
  role: Role | null;
  can: Capabilities;
};

function capsFor(isSuperAdmin: boolean, role: Role | null): Capabilities {
  const admin = isSuperAdmin || role === "admin";
  const edit = admin || role === "editor";
  const view = edit || role === "viewer";
  const analytics = isSuperAdmin || role != null;
  return {
    manageMembers: admin,
    editCampaigns: edit,
    sendCampaigns: edit,
    viewCampaigns: view,
    viewAnalytics: analytics,
  };
}

/** Standard 403 response for capability checks in API routes. */
export function forbidden() {
  return Response.json(
    { error: "You don't have permission to do that." },
    { status: 403 }
  );
}

type SessionLike = { user: { id: string; email?: string | null } };

/** Resolves the signed-in user's workspace access for this request. */
export async function getAccess(session: SessionLike): Promise<Access> {
  const email = session.user.email ?? null;
  const isSuperAdmin = isAdminEmail(email);

  let role: Role | null = null;
  if (!isSuperAdmin) {
    const [row] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id));
    role = row?.role ?? null;
  }

  return {
    userId: session.user.id,
    email,
    domain: emailDomain(email),
    isSuperAdmin,
    role,
    can: capsFor(isSuperAdmin, role),
  };
}

// ---------------------------------------------------------------------------
// Invite-only workspace join. Decision is read-only; provisioning writes.
// ---------------------------------------------------------------------------

export type JoinDecision = {
  allowed: boolean;
  superAdmin: boolean;
  role: Role | null;
  isFirstUser: boolean;
  invitationId?: string;
  reason?: string;
};

export const NEEDS_INVITE_MESSAGE =
  "This domain is managed by a workspace admin - ask them to invite you.";

/**
 * Decides whether `email` may sign in / sign up and with what role, WITHOUT
 * writing anything:
 *   - super-admin (cloudsheer.com) -> allowed.
 *   - returning member (already has a role) -> allowed, keep their role.
 *   - domain not yet claimed -> allowed as the first user (admin).
 *   - claimed domain + a pending invite for this email -> allowed, invited role.
 *   - claimed domain + no invite -> denied.
 */
export async function decideWorkspaceJoin(email: string): Promise<JoinDecision> {
  const normalized = email.trim().toLowerCase();

  if (isAdminEmail(normalized)) {
    return { allowed: true, superAdmin: true, role: null, isFirstUser: false };
  }

  const domain = emailDomain(normalized);
  if (!domain) {
    return {
      allowed: false,
      superAdmin: false,
      role: null,
      isFirstUser: false,
      reason: "Enter a valid email address.",
    };
  }

  const [existing] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(sql`lower(${users.email})`, normalized));
  if (existing?.role) {
    return {
      allowed: true,
      superAdmin: false,
      role: existing.role,
      isFirstUser: false,
    };
  }

  const [workspace] = await db
    .select({ domain: workspaces.domain })
    .from(workspaces)
    .where(eq(workspaces.domain, domain));
  if (!workspace) {
    return { allowed: true, superAdmin: false, role: "admin", isFirstUser: true };
  }

  const [invite] = await db
    .select({ id: invitations.id, role: invitations.role })
    .from(invitations)
    .where(
      and(
        eq(sql`lower(${invitations.email})`, normalized),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      )
    )
    .orderBy(desc(invitations.createdAt));
  if (invite) {
    return {
      allowed: true,
      superAdmin: false,
      role: invite.role,
      isFirstUser: false,
      invitationId: invite.id,
    };
  }

  return {
    allowed: false,
    superAdmin: false,
    role: null,
    isFirstUser: false,
    reason: NEEDS_INVITE_MESSAGE,
  };
}

/**
 * Applies the side effects of an allowed join: sets the user's role, claims
 * the domain workspace when they're the first user, and marks any consumed
 * invitation accepted. Idempotent and a no-op for super-admins.
 */
export async function provisionWorkspaceJoin(
  userId: string,
  email: string,
  decision: JoinDecision
): Promise<void> {
  if (decision.superAdmin || !decision.allowed) return;

  const domain = emailDomain(email);
  if (!domain) return;

  if (decision.role) {
    await db
      .update(users)
      .set({ role: decision.role })
      .where(eq(users.id, userId));
  }

  if (decision.isFirstUser) {
    await db
      .insert(workspaces)
      .values({ domain, name: domain, createdBy: userId })
      .onConflictDoNothing();
  }

  if (decision.invitationId) {
    await db
      .update(invitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(invitations.id, decision.invitationId));
  }
}
