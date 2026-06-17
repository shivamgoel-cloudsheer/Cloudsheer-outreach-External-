import { auth } from "@/auth";
import { getAccess, forbidden } from "@/lib/roles";
import {
  listMembers,
  listPendingInvites,
  listWorkspaces,
  manageableDomain,
} from "@/lib/members";

export const dynamic = "force-dynamic";

// Workspace members + pending invitations for the admin's domain. Super-admins
// may pass ?domain= to manage any workspace, or omit it to get the picker list.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  const access = await getAccess(session);
  if (!access.can.manageMembers) return forbidden();

  const requested = new URL(request.url).searchParams.get("domain");
  const domain = manageableDomain(access, requested);

  if (!domain) {
    // Super-admin without a chosen domain: return the workspace picker.
    if (access.isSuperAdmin) {
      return Response.json({
        isSuperAdmin: true,
        domain: null,
        self: access.userId,
        workspaces: await listWorkspaces(),
        members: [],
        invitations: [],
      });
    }
    return forbidden();
  }

  const [members, invitations, workspaces] = await Promise.all([
    listMembers(domain),
    listPendingInvites(domain),
    access.isSuperAdmin ? listWorkspaces() : Promise.resolve(undefined),
  ]);

  return Response.json({
    isSuperAdmin: access.isSuperAdmin,
    domain,
    self: access.userId,
    workspaces,
    members,
    invitations,
  });
}
