import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { SENDERS, isAllowedSenderEmail } from "@/lib/senders";
import { getSenderAccount, hasSendScope } from "@/lib/google";
import { getAccess } from "@/lib/roles";

type SenderStatus = {
  name: string;
  email: string;
  linked: boolean;
  sendReady: boolean;
};

// Sender mailboxes the signed-in user may pick as the campaign From. Scoped by
// workspace: cloudsheer super-admins get the preset cloudsheer mailboxes;
// clients get ONLY the connected mailboxes on their own domain - they never
// see another tenant's (e.g. cloudsheer's) mailboxes.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  const access = await getAccess(session);

  let senders: SenderStatus[] = [];

  if (access.isSuperAdmin) {
    senders = await Promise.all(
      SENDERS.map(async (s) => {
        const account = await getSenderAccount(s.email);
        return {
          name: s.name,
          email: s.email,
          linked: !!account,
          sendReady: !!account && hasSendScope(account.scope),
        };
      })
    );
  } else if (access.domain) {
    const rows = await db
      .select({ email: users.email, name: users.name, scope: accounts.scope })
      .from(users)
      .innerJoin(
        accounts,
        and(eq(accounts.userId, users.id), eq(accounts.provider, "google"))
      )
      .where(eq(sql`lower(split_part(${users.email}, '@', 2))`, access.domain));
    senders = rows
      .filter((r): r is { email: string; name: string | null; scope: string | null } => !!r.email)
      .map((r) => ({
        name: r.name ?? r.email.split("@")[0],
        email: r.email,
        linked: true,
        sendReady: hasSendScope(r.scope),
      }));
  }

  // The signed-in user can always send from their own mailbox once it's linked
  // with send scope, even if it isn't already in the list above.
  const email = session.user.email ?? null;
  const me =
    email && isAllowedSenderEmail(email)
      ? {
          name: session.user.name ?? "",
          email,
          linked: true,
          sendReady: hasSendScope(
            (await getSenderAccount(email))?.scope ?? null
          ),
        }
      : null;

  return Response.json({ senders, me });
}
