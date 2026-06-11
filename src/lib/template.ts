/**
 * Replaces {{Column Name}} placeholders with values from the row data.
 * Matching is case-insensitive and whitespace-tolerant.
 */
export function renderTemplate(
  template: string,
  data: Record<string, string>
): string {
  const lookup = new Map(
    Object.entries(data).map(([k, v]) => [k.trim().toLowerCase(), v])
  );
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, key: string) => {
    return lookup.get(key.toLowerCase()) ?? "";
  });
}

/** Lists distinct placeholder names used in a template. */
export function extractPlaceholders(template: string): string[] {
  const found = new Set<string>();
  for (const match of template.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
    found.add(match[1]);
  }
  return [...found];
}

/** Returns placeholders that don't correspond to any sheet column. */
export function findUnknownPlaceholders(
  template: string,
  headers: string[]
): string[] {
  const known = new Set(headers.map((h) => h.trim().toLowerCase()));
  return extractPlaceholders(template).filter(
    (p) => !known.has(p.trim().toLowerCase())
  );
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Reply-based opt-out: reads like a human note, not a broadcast. A reply of
// any kind is caught by reply detection and stops the sequence. The postal
// address stays as one quiet line for CAN-SPAM.
const OPT_OUT_LINE = "If this isn't relevant, just reply and I'll stop reaching out.";

/**
 * Builds the HTML and plain-text bodies for an email. If the rendered body
 * already looks like HTML it is passed through; otherwise newlines become
 * <br/> tags. The signature, a quiet reply-based opt-out line, and the
 * sender's physical postal address (CAN-SPAM) are appended. No unsubscribe
 * link - that link plus the "unsubscribe here" wording is a bulk-mail signal,
 * and the link domain (the app host) mismatching the sender domain hurts more.
 */
export function buildEmailBodies(
  renderedBody: string,
  mailingAddress: string,
  signature?: string | null
): { html: string; text: string } {
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(renderedBody);
  const sig = signature?.trim() || "";

  const htmlBody = looksLikeHtml
    ? renderedBody
    : escapeHtml(renderedBody).replace(/\r?\n/g, "<br/>");
  const htmlSig = sig
    ? `<p style="margin-top: 16px;">${escapeHtml(sig).replace(/\r?\n/g, "<br/>")}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">
    <div>${htmlBody}</div>
    ${htmlSig}
    <p style="margin-top: 24px; font-size: 12px; color: #999999;">${escapeHtml(
      OPT_OUT_LINE
    )}</p>
    <p style="margin-top: 4px; font-size: 12px; color: #aaaaaa;">${escapeHtml(
      mailingAddress
    )}</p>
  </body>
</html>`;

  const text = `${renderedBody}${sig ? `\n\n${sig}` : ""}\n\n${OPT_OUT_LINE}\n${mailingAddress}`;

  return { html, text };
}
