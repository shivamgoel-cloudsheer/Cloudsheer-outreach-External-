import { after } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns, recipients, unsubscribes } from "@/db/schema";
import { getResend } from "@/lib/resend";
import { buildEmailBodies, renderTemplate } from "@/lib/template";

export const maxDuration = 300;

const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES_MS = 600;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;

  // Atomic guard: only a draft or previously failed campaign can start sending.
  const [campaign] = await db
    .update(campaigns)
    .set({ status: "sending" })
    .where(
      and(
        eq(campaigns.id, id),
        eq(campaigns.userId, session.user.id),
        inArray(campaigns.status, ["draft", "failed"])
      )
    )
    .returning();

  if (!campaign) {
    return Response.json(
      { error: "Campaign not found or already sending/sent" },
      { status: 409 }
    );
  }

  // Respond immediately; the send loop continues after the response.
  after(() => runSend(campaign.id));

  return Response.json({ status: "sending" }, { status: 202 });
}

async function runSend(campaignId: string) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const from = process.env.RESEND_FROM!;
  const replyTo = process.env.RESEND_REPLY_TO;

  try {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));
    if (!campaign) return;

    const pending = await db
      .select()
      .from(recipients)
      .where(
        and(
          eq(recipients.campaignId, campaignId),
          eq(recipients.status, "pending")
        )
      );

    // Suppression list: anyone who unsubscribed, bounced, or complained before
    const suppressedEmails = new Set(
      (await db.select({ email: unsubscribes.email }).from(unsubscribes)).map(
        (u) => u.email
      )
    );

    const toSuppress = pending.filter((r) =>
      suppressedEmails.has(r.email.toLowerCase())
    );
    if (toSuppress.length > 0) {
      await db
        .update(recipients)
        .set({ status: "suppressed" })
        .where(
          inArray(
            recipients.id,
            toSuppress.map((r) => r.id)
          )
        );
    }

    const toSend = pending.filter(
      (r) => !suppressedEmails.has(r.email.toLowerCase())
    );

    let sentCount = campaign.sentCount;
    let anySent = sentCount > 0;
    let anyError = false;

    for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
      const chunk = toSend.slice(i, i + BATCH_SIZE);

      const payload = chunk.map((r) => {
        const unsubscribeUrl = `${appUrl}/u/${r.unsubscribeToken}`;
        const subject = renderTemplate(campaign.subjectTemplate, r.rowData);
        const renderedBody = renderTemplate(campaign.bodyTemplate, r.rowData);
        const { html, text } = buildEmailBodies(renderedBody, unsubscribeUrl);

        return {
          from,
          to: [r.email],
          ...(replyTo ? { replyTo } : {}),
          subject,
          html,
          text,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
          tags: [
            { name: "recipient_id", value: r.id },
            { name: "campaign_id", value: campaign.id },
          ],
        };
      });

      const chunkIndex = Math.floor(i / BATCH_SIZE);
      let lastError: string | null = null;
      let results: { id: string }[] | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const { data, error } = await getResend().batch.send(payload, {
          idempotencyKey: `campaign-${campaign.id}-chunk-${chunkIndex}`,
        });

        if (!error && data) {
          results = data.data;
          break;
        }

        lastError = error?.message ?? "Unknown Resend error";
        // Back off on rate limits or transient failures
        await sleep(1000 * 2 ** attempt);
      }

      if (results) {
        // The batch response returns email IDs in request order
        for (let j = 0; j < chunk.length; j++) {
          await db
            .update(recipients)
            .set({ status: "sent", resendEmailId: results[j]?.id ?? null })
            .where(eq(recipients.id, chunk[j].id));
        }
        sentCount += chunk.length;
        anySent = true;
        await db
          .update(campaigns)
          .set({ sentCount })
          .where(eq(campaigns.id, campaign.id));
      } else {
        anyError = true;
        await db
          .update(recipients)
          .set({ status: "failed", error: lastError })
          .where(
            inArray(
              recipients.id,
              chunk.map((r) => r.id)
            )
          );
      }

      if (i + BATCH_SIZE < toSend.length) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    await db
      .update(campaigns)
      .set({
        status: anySent ? "sent" : anyError ? "failed" : "sent",
        sentAt: new Date(),
      })
      .where(eq(campaigns.id, campaign.id));
  } catch (error) {
    console.error("Campaign send failed", error);
    await db
      .update(campaigns)
      .set({ status: "failed" })
      .where(eq(campaigns.id, campaignId));
  }
}
