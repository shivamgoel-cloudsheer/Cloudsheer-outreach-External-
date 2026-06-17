import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccess } from "@/lib/roles";
import MembersClient from "./MembersClient";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const access = await getAccess(session);
  if (!access.can.manageMembers) redirect("/dashboard");

  return <MembersClient isSuperAdmin={access.isSuperAdmin} />;
}
