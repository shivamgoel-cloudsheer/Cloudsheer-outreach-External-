/**
 * Manager/admin access. A user is an admin if their email DOMAIN is in
 * ADMIN_DOMAINS (comma-separated, defaults to "cloudsheer.com") or their exact
 * email is in ADMIN_EMAILS (comma-separated). Admins can see and control EVERY
 * campaign - not just the ones they created - so CloudSheer staff manage the
 * whole tool across every client mailbox from their own Google login. Everyone
 * else (clients) sees and controls only the campaigns they created.
 */
const DEFAULT_ADMIN_DOMAINS = ["cloudsheer.com"];

function adminDomains(): string[] {
  const raw = process.env.ADMIN_DOMAINS?.trim();
  if (!raw) return DEFAULT_ADMIN_DOMAINS;
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (adminEmails().includes(normalized)) return true;
  const at = normalized.lastIndexOf("@");
  if (at < 0) return false;
  return adminDomains().includes(normalized.slice(at + 1));
}
