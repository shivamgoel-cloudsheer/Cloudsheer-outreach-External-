import { after } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns, recipients } from "@/db/schema";
import { getResend } from "@/lib/resend";

export const maxDuration = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, session.user.id)));

  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Capture queued emails before the cascade delete removes the rows,
  // so they can still be pulled back from Resend afterwards.
  const queued = await db
    .select({ resendEmailId: recipients.resendEmailId })
    .from(recipients)
    .where(
      and(
        eq(recipients.campaignId, id),
        eq(recipients.status, "scheduled"),
        isNotNull(recipients.resendEmailId)
      )
    );

  await db.delete(campaigns).where(eq(campaigns.id, id));

  if (queued.length > 0) {
    after(async () => {
      for (let i = 0; i < queued.length; i++) {
        try {
          await getResend().emails.cancel(queued[i].resendEmailId!);
        } catch (e) {
          console.error("Cancel during delete failed", e);
        }
        if (i < queued.length - 1) await sleep(600);
      }
    });
  }

  return Response.json({ deleted: true, cancelledScheduled: queued.length });
}
