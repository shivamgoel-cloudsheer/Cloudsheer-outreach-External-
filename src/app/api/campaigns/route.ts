import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns, recipients } from "@/db/schema";
import { getValidAccessToken } from "@/lib/google";
import {
  fetchSheetRows,
  findEmailColumn,
  isValidEmail,
  parseSheetUrl,
} from "@/lib/sheets";
import { findUnknownPlaceholders } from "@/lib/template";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  sheetUrl: z.string().min(1),
  subjectTemplate: z.string().min(1).max(500),
  bodyTemplate: z.string().min(1).max(100_000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { name, sheetUrl, subjectTemplate, bodyTemplate } = parsed.data;

  const sheetId = parseSheetUrl(sheetUrl);
  if (!sheetId) {
    return Response.json(
      { error: "That doesn't look like a Google Sheets URL or ID" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidAccessToken(session.user.id);
    const sheet = await fetchSheetRows(accessToken, sheetId);

    const emailColumn = sheet.emailColumn ?? findEmailColumn(sheet.headers);
    if (!emailColumn) {
      return Response.json(
        { error: "No email column found. Add a column named Email." },
        { status: 400 }
      );
    }

    const unknown = [
      ...findUnknownPlaceholders(subjectTemplate, sheet.headers),
      ...findUnknownPlaceholders(bodyTemplate, sheet.headers),
    ];
    if (unknown.length > 0) {
      return Response.json(
        {
          error: `Unknown placeholders (no matching sheet column): ${unknown.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const nameColumn = sheet.headers.find(
      (h) => h.trim().toLowerCase() === "name"
    );

    const validRows = sheet.rows.filter((row) =>
      isValidEmail(row[emailColumn] ?? "")
    );
    const skipped = sheet.rows.length - validRows.length;

    if (validRows.length === 0) {
      return Response.json(
        { error: `No rows with a valid email in column "${emailColumn}"` },
        { status: 400 }
      );
    }

    const [campaign] = await db
      .insert(campaigns)
      .values({
        userId: session.user.id,
        name,
        sheetId,
        sheetUrl,
        subjectTemplate,
        bodyTemplate,
        status: "draft",
        total: validRows.length,
      })
      .returning();

    // Insert recipients in chunks to stay under statement parameter limits
    const CHUNK = 500;
    for (let i = 0; i < validRows.length; i += CHUNK) {
      await db.insert(recipients).values(
        validRows.slice(i, i + CHUNK).map((row) => ({
          campaignId: campaign.id,
          email: row[emailColumn].trim().toLowerCase(),
          name: nameColumn ? row[nameColumn] || null : null,
          rowData: row,
          unsubscribeToken: nanoid(32),
        }))
      );
    }

    return Response.json({
      id: campaign.id,
      total: validRows.length,
      skippedInvalidEmails: skipped,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create campaign",
      },
      { status: 502 }
    );
  }
}
