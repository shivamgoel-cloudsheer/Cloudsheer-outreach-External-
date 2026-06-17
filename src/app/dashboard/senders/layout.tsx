import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccess } from "@/lib/roles";

// Mailbox management is for members who can send (admin/editor).
export default async function SendersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (!(await getAccess(session)).can.editCampaigns) redirect("/dashboard");
  return <>{children}</>;
}
