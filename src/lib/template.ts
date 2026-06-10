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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds the HTML and plain-text bodies for an email. If the rendered body
 * already looks like HTML it is passed through; otherwise newlines become
 * <br/> tags. An unsubscribe footer is always appended.
 */
export function buildEmailBodies(
  renderedBody: string,
  unsubscribeUrl: string
): { html: string; text: string } {
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(renderedBody);

  const htmlBody = looksLikeHtml
    ? renderedBody
    : escapeHtml(renderedBody).replace(/\r?\n/g, "<br/>");

  const html = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">
    <div>${htmlBody}</div>
    <p style="margin-top: 32px; font-size: 12px; color: #888888;">
      If you'd prefer not to receive these emails, you can
      <a href="${unsubscribeUrl}" style="color: #888888;">unsubscribe here</a>.
    </p>
  </body>
</html>`;

  const text = `${renderedBody}\n\n----\nIf you'd prefer not to receive these emails, unsubscribe here: ${unsubscribeUrl}`;

  return { html, text };
}
