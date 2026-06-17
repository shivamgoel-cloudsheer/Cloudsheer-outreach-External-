import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAccess, forbidden, ROLES, type Role } from "@/lib/roles";
import { emailDomain } from "@/lib/scope";

const patchSchema = z.object({ role: z.enum(ROLES as [string, ...string[]]) });

// Loads the target user and confirms the signed-in admin may manage their
// workspace. Returns the target row or an error Response.
async function loadTarget(
  request: Request,
  params: Promise<{ userId: string }>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: Response.json({ error: "Not signed in" }, { status: 401 }) };
  }
  const access = await getAccess(session);
  if (!access.can.manageMembers) return { error: forbidden() };

  const { userId } = await params;
  const [target] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId));
  if (!target) {
    return { error: Response.json({ error: "User not found" }, { status: 404 }) };
  }

  const targetDomain = emailDomain(target.email);
  // Domain admins manage only their own domain; super-admins manage any.
  if (!access.isSuperAdmin && targetDomain !== access.domain) {
    return { error: forbidden() };
  }
  return { access, target, targetDomain };
}

/** Number of remaining admins in a domain, to protect the last one. */
async function adminCount(domain: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(
      and(
        eq(sql`lower(split_part(${users.email}, '@', 2))`, domain),
        eq(users.role, "admin")
      )
    );
  return row?.n ?? 0;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const loaded = await loadTarget(request, params);
  if ("error" in loaded) return loaded.error;
  const { target, targetDomain } = loaded;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }
  const role = parsed.data.role as Role;

  // Don't strip the workspace's last admin.
  if (
    target.role === "admin" &&
    role !== "admin" &&
    targetDomain &&
    (await adminCount(targetDomain)) <= 1
  ) {
    return Response.json(
      { error: "A workspace must keep at least one admin." },
      { status: 409 }
    );
  }

  await db.update(users).set({ role }).where(eq(users.id, target.id));
  return Response.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const loaded = await loadTarget(request, params);
  if ("error" in loaded) return loaded.error;
  const { target, targetDomain } = loaded;

  if (!target.role) return Response.json({ ok: true }); // already removed

  if (
    target.role === "admin" &&
    targetDomain &&
    (await adminCount(targetDomain)) <= 1
  ) {
    return Response.json(
      { error: "A workspace must keep at least one admin." },
      { status: 409 }
    );
  }

  // Revoke access by clearing the role. The user row (and their campaigns,
  // which belong to the workspace) is kept - deleting would cascade them away.
  await db.update(users).set({ role: null }).where(eq(users.id, target.id));
  return Response.json({ ok: true });
}
