import { desc, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns, users } from "@/db/schema";
import { visibleUserIds } from "@/lib/scope";
import { getSender } from "@/lib/senders";
import AnalyticsClient, { type CampaignListItem } from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  // Admins see all campaigns; clients see every campaign on their own domain.
  const ids = await visibleUserIds(session!.user);
  const showOwners = ids === null || ids.length > 1;

  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      status: campaigns.status,
      total: campaigns.total,
      sentCount: campaigns.sentCount,
      createdAt: campaigns.createdAt,
      userId: campaigns.userId,
    })
    .from(campaigns)
    .where(ids === null ? undefined : inArray(campaigns.userId, ids))
    .orderBy(desc(campaigns.createdAt));

  // Label each campaign with who created it when more than one owner is shown.
  const ownerById = new Map<string, string>();
  if (showOwners && rows.length > 0) {
    const ownerIds = [...new Set(rows.map((r) => r.userId))];
    const owners = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, ownerIds));
    for (const o of owners) {
      ownerById.set(
        o.id,
        (o.email ? getSender(o.email)?.name : null) ?? o.name ?? o.email ?? ""
      );
    }
  }

  const list: CampaignListItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    total: r.total,
    sentCount: r.sentCount,
    createdAt: r.createdAt.toISOString(),
    owner: showOwners ? ownerById.get(r.userId) ?? null : null,
  }));

  return <AnalyticsClient campaigns={list} />;
}
