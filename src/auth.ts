import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";
import { findUserByEmail, verifyPassword } from "@/lib/password";
import { isAdminEmail } from "@/lib/admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Write access so campaign status can be synced back into the sheet
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
// Read-only inbox access for reply detection
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
// Send-as-the-user access; emails go out through the sender's own mailbox
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // JWT sessions are required for the Credentials (email + password) provider;
  // the Google/Gmail/Sheets tokens still live in the accounts table via the
  // adapter, so server-side API calls are unaffected.
  session: { strategy: "jwt" },
  // Sign-in and sign-up happen only on the landing page ("/"), never on the
  // default Auth.js page. Any sign-in flow Auth.js triggers redirects here.
  pages: { signIn: "/" },
  providers: [
    Google({
      // Lets a client who signed up with email + password later "Connect
      // Google" with the SAME email: the OAuth account links to their existing
      // user row instead of erroring. Safe here because Google verifies the
      // email; see the signup flow, which refuses admin-domain addresses.
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          // offline + consent guarantees a refresh_token on every sign-in,
          // which we need for server-side Sheets API calls
          access_type: "offline",
          prompt: "consent",
          scope: `openid email profile ${SHEETS_SCOPE} ${GMAIL_SCOPE} ${GMAIL_SEND_SCOPE}`,
        },
      },
    }),
    // Clients (any non-cloudsheer.com domain) sign in with their email as the
    // user id plus a password. Admin-domain emails are refused here and must
    // use Google.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        if (isAdminEmail(email)) return null; // admins use Google
        const user = await findUserByEmail(email);
        if (!user?.passwordHash) return null;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    // Carry the user id on the token (set on first sign-in for both providers)
    // and expose it on the session, matching the previous database-session API.
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string | undefined) ?? token.sub ?? "";
      }
      return session;
    },
  },
  events: {
    // The Drizzle adapter only writes the account row on first link; on later
    // sign-ins the fresh tokens/scope (e.g. a newly granted gmail.send) would
    // be dropped without this upsert.
    async signIn({ account }) {
      if (account?.provider !== "google" || !account.access_token) return;
      await db
        .update(accounts)
        .set({
          access_token: account.access_token,
          // Google may omit the refresh token on re-consent; keep the old one
          ...(account.refresh_token
            ? { refresh_token: account.refresh_token }
            : {}),
          expires_at: account.expires_at,
          scope: account.scope,
        })
        .where(
          and(
            eq(accounts.provider, "google"),
            eq(accounts.providerAccountId, account.providerAccountId)
          )
        );
    },
  },
});
