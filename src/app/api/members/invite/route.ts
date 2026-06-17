import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { db } from "@/db";
import { invitations, users } from "@/db/schema";
import { getAccess, forbidden, ROLES } from "@/lib/roles";
import { emailDomain } from "@/lib/scope";
import { manageableDomain, sendInviteEmail } from "@/lib/members";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const schema = z.object({
  email: z.string().email().max(200),
  role: z.enum(ROLES as [string, ...string[]]),
  // Super-admins may target another workspace; ignored for domain admins.
  domain: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  const access = await getAccess(session);
  if (!access.can.manageMembers) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email and role." }, { status: 400 });
  }

  const domain = manageableDomain(access, parsed.data.domain ?? null);
  if (!domain) {
    return Response.json({ error: "No workspace to invite to." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const role = parsed.data.role as (typeof ROLES)[number];

  // The invitee must be on this workspace's domain, or they couldn't join it.
  if (emailDomain(email) !== domain) {
    return Response.json(
      { error: `Invite an email on the @${domain} domain.` },
      { status: 400 }
    );
  }

  // Don't invite someone who is already an active member.
  const [existing] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email));
  if (existing?.role) {
    return Response.json(
      { error: "That person is already a member of this workspace." },
      { status: 409 }
    );
  }

  // Supersede any earlier pending invite for this email so only the newest
  // link is valid.
  await db
    .update(invitations)
    .set({ status: "revoked" })
    .where(
      and(
        eq(sql`lower(${invitations.email})`, email),
        eq(invitations.domain, domain),
        eq(invitations.status, "pending")
      )
    );

  const token = nanoid(32);
  await db.insert(invitations).values({
    email,
    domain,
    role,
    token,
    invitedBy: access.userId,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  const link = `${new URL(request.url).origin}/invite/${token}`;

  let emailed = false;
  if (access.email) {
    try {
      emailed = await sendInviteEmail({
        fromEmail: access.email,
        fromName: session.user.name ?? null,
        toEmail: email,
        role,
        domain,
        link,
      });
    } catch {
      emailed = false; // fall back to surfacing the link
    }
  }

  return Response.json({ ok: true, emailed, link });
}

// Revoke a pending invitation (by id) within a workspace the admin manages.
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  const access = await getAccess(session);
  if (!access.can.manageMembers) return forbidden();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const [invite] = await db
    .select({ domain: invitations.domain })
    .from(invitations)
    .where(eq(invitations.id, id));
  if (!invite) return Response.json({ ok: true }); // already gone

  // Domain admins may only revoke invites for their own domain.
  if (!access.isSuperAdmin && invite.domain !== access.domain) {
    return forbidden();
  }

  await db
    .update(invitations)
    .set({ status: "revoked" })
    .where(eq(invitations.id, id));
  return Response.json({ ok: true });
}
