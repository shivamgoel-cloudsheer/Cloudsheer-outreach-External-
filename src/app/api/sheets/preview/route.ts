import { z } from "zod";
import { auth } from "@/auth";
import { getValidAccessToken } from "@/lib/google";
import { fetchSheetRows, fetchSheetTabs, parseSheetUrl } from "@/lib/sheets";

const bodySchema = z.object({
  sheetUrl: z.string().min(1),
  sheetTab: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "sheetUrl is required" }, { status: 400 });
  }

  const sheetId = parseSheetUrl(parsed.data.sheetUrl);
  if (!sheetId) {
    return Response.json(
      { error: "That doesn't look like a Google Sheets URL or ID" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidAccessToken(session.user.id);
    const tabs = await fetchSheetTabs(accessToken, sheetId);
    // Use the requested tab if it exists, otherwise the first one.
    const selectedTab =
      parsed.data.sheetTab && tabs.includes(parsed.data.sheetTab)
        ? parsed.data.sheetTab
        : (tabs[0] ?? null);
    const sheet = await fetchSheetRows(accessToken, sheetId, selectedTab);
    return Response.json({
      sheetId: sheet.sheetId,
      tabs,
      selectedTab,
      headers: sheet.headers,
      emailColumn: sheet.emailColumn,
      totalRows: sheet.rows.length,
      sampleRows: sheet.rows.slice(0, 5),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to read sheet" },
      { status: 502 }
    );
  }
}
