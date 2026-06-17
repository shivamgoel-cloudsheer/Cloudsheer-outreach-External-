import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccess } from "@/lib/roles";

// Analysts have no campaign access; everyone else (admin/editor/viewer) may
// open campaign detail. Editing is gated separately inside the page + API.
export default async function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (!(await getAccess(session)).can.viewCampaigns) {
    redirect("/dashboard/analytics");
  }
  return <>{children}</>;
}
