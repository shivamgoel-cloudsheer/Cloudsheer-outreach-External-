import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccess } from "@/lib/roles";

// Only members who can edit campaigns may open the creation flow.
export default async function NewCampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (!(await getAccess(session)).can.editCampaigns) redirect("/dashboard");
  return <>{children}</>;
}
