import { auth } from "@/auth";
import { getValidAccessToken } from "@/lib/google";
import { getAccess, forbidden } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Hands the browser a short-lived Google access token so the client-side
 * Google Picker can authorize. The Picker runs in the browser, so it needs a
 * token there; the refresh token never leaves the server.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!(await getAccess(session)).can.editCampaigns) return forbidden();

  try {
    const accessToken = await getValidAccessToken(session.user.id);
    return Response.json({ accessToken });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "No Google account linked. Sign in with Google again.",
      },
      { status: 400 }
    );
  }
}
