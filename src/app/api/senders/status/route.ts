import { auth } from "@/auth";
import { SENDERS } from "@/lib/senders";
import { getSenderAccount, hasSendScope } from "@/lib/google";

// Link status for each configured sender mailbox, so the campaign form can
// disable senders that can't send yet.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const senders = await Promise.all(
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

  // The signed-in user can always send from their own mailbox (any cloudsheer.com
  // login), even if they aren't one of the preset senders. The form uses this to
  // add their address to the From list.
  const email = session.user.email ?? null;
  const me =
    email && email.toLowerCase().endsWith("@cloudsheer.com")
      ? {
          name: session.user.name ?? "",
          email,
          linked: true,
          // They're signed in right now; send readiness still depends on scope.
          sendReady: hasSendScope(
            (await getSenderAccount(email))?.scope ?? null
          ),
        }
      : null;

  return Response.json({ senders, me });
}
