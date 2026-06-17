// One-time, idempotent backfill for the workspace/roles feature.
// - Claims a workspace for every existing non-cloudsheer.com domain.
// - Grants existing client users the "admin" role so nobody loses the full
//   access they had before roles existed. cloudsheer.com stays super-admin
//   (role left null; handled by isAdminEmail).
//
// Run once after `npm run db:push`:  node scripts/backfill-roles.mjs
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const ADMIN_DOMAIN = "cloudsheer.com";
const sql = neon(process.env.DATABASE_URL);

const before = await sql`
  SELECT count(*)::int AS n FROM "user"
  WHERE role IS NULL AND email IS NOT NULL
    AND lower(split_part(email, '@', 2)) <> ${ADMIN_DOMAIN}`;
console.log(`Client users without a role (will become admin): ${before[0].n}`);

await sql`
  INSERT INTO workspace (domain, name, created_by)
  SELECT d.domain, d.domain, d.uid FROM (
    SELECT lower(split_part(email, '@', 2)) AS domain, min(id) AS uid
    FROM "user"
    WHERE email IS NOT NULL
      AND lower(split_part(email, '@', 2)) <> ${ADMIN_DOMAIN}
    GROUP BY 1
  ) d
  ON CONFLICT (domain) DO NOTHING`;

await sql`
  UPDATE "user" SET role = 'admin'
  WHERE role IS NULL AND email IS NOT NULL
    AND lower(split_part(email, '@', 2)) <> ${ADMIN_DOMAIN}`;

const workspaces = await sql`SELECT count(*)::int AS n FROM workspace`;
const admins = await sql`SELECT count(*)::int AS n FROM "user" WHERE role = 'admin'`;
console.log(`Workspaces now: ${workspaces[0].n}`);
console.log(`Users with admin role now: ${admins[0].n}`);
console.log("Backfill complete.");
