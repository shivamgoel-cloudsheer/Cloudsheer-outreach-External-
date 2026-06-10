export type SheetData = {
  sheetId: string;
  headers: string[];
  rows: Record<string, string>[];
  emailColumn: string | null;
};

/** Extracts the spreadsheet ID from a pasted Google Sheets URL (or accepts a bare ID). */
export function parseSheetUrl(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

const EMAIL_HEADER_CANDIDATES = ["email", "e-mail", "mail id", "mail", "email id", "email address"];

export function findEmailColumn(headers: string[]): string | null {
  for (const candidate of EMAIL_HEADER_CANDIDATES) {
    const hit = headers.find((h) => h.trim().toLowerCase() === candidate);
    if (hit) return hit;
  }
  // Fallback: any header containing "email"
  return headers.find((h) => h.toLowerCase().includes("email")) ?? null;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Fetches the first sheet of the spreadsheet. Row 1 is treated as headers;
 * every following row becomes a { [header]: value } record.
 */
export async function fetchSheetRows(
  accessToken: string,
  sheetId: string
): Promise<SheetData> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:ZZ100000?majorDimension=ROWS`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 403) {
      throw new Error(
        "Google denied access to this sheet. Make sure you own it or it is shared with your account."
      );
    }
    if (response.status === 404) {
      throw new Error("Sheet not found. Check the URL.");
    }
    throw new Error(`Sheets API error ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as { values?: string[][] };
  const values = data.values ?? [];

  if (values.length < 2) {
    throw new Error(
      "The sheet needs a header row plus at least one data row."
    );
  }

  const headers = values[0].map((h) => String(h ?? "").trim()).filter(Boolean);
  const rows = values.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = String(row[i] ?? "").trim();
    });
    return record;
  });

  return {
    sheetId,
    headers,
    rows,
    emailColumn: findEmailColumn(headers),
  };
}
