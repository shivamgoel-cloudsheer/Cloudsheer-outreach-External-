import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Complete scheduled campaigns whose emails have all actually gone out.
const updated = await sql`
  update campaign c
  set status = 'sent', sent_at = now()
  where c.status = 'scheduled'
    and not exists (
      select 1 from recipient r
      where r.campaign_id = c.id and r.status in ('pending', 'scheduled')
    )
  returning c.name, c.status`;
console.log(JSON.stringify(updated, null, 1));
