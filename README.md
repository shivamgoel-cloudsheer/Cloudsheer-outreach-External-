# CloudSheer Outreach

Send personalized email campaigns straight from a Google Sheet, with per-recipient delivery, open, and click tracking.

- Sign in with Google (the same grant gives read access to your Sheets)
- Paste a sheet URL, preview the rows, compose with `{{Column}}` placeholders
- Emails are sent through the Resend API in batches with rate limiting
- Resend webhooks update each recipient: sent, delivered, opened, clicked, bounced
- Automatic unsubscribe links, one-click unsubscribe headers, and a suppression list

## Stack

Next.js 16 (App Router) · Auth.js v5 · Neon Postgres + Drizzle ORM · Resend · Tailwind 4

## Sheet format

Row 1 must be headers. An **Email** column is required (also matched: "Mail ID", "Email Address", etc.). Every other column becomes a placeholder, for example:

| Name | Email | Subject | Email Content |
|------|-------|---------|---------------|
| Sara | sara@acme.com | Quick intro | Hi Sara, ... |

In the composer you can then write `{{Name}}`, `{{Subject}}`, `{{Email Content}}`, or any other column header.

## Setup

### 1. Database (Neon)

1. Create a free project at [neon.tech](https://neon.tech) (or install the Neon integration from the Vercel Marketplace).
2. Copy the connection string into `DATABASE_URL` in `.env.local`.
3. Push the schema: `npm run db:push`

### 2. Google Cloud (sign-in + Sheets access)

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com) and enable the **Google Sheets API**.
2. Configure the OAuth consent screen: External, Testing mode, and add your own Google account as a test user.
3. Create an OAuth Client ID (type: Web application) with these redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-APP.vercel.app/api/auth/callback/google`
4. Copy the client ID and secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

Note: in Testing mode, Google expires refresh tokens after 7 days, so you must sign in again weekly. To avoid that, set the consent screen's publishing status to "In production". You'll see an unverified app warning once, which is fine for a personal tool.

### 3. Resend (sending + tracking)

1. At [resend.com](https://resend.com), add the domain **mail.cloudsheer.com** (a subdomain protects the reputation of your root domain) and add the DNS records it gives you.
2. In the domain settings, enable **Open Tracking** and **Click Tracking**. Tracking is configured per domain, so this is required for opens and clicks to appear.
3. Create an API key and put it in `RESEND_API_KEY`.
4. After your first deploy, add a webhook pointing to `https://YOUR-APP.vercel.app/api/webhooks/resend` and subscribe to all `email.*` events. Copy the signing secret (`whsec_...`) into `RESEND_WEBHOOK_SECRET`.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in every value. Generate `AUTH_SECRET` with `npx auth secret`. Set the same variables in your Vercel project settings, with `APP_URL` pointing at the deployed URL.

### 5. Run

```bash
npm install
npm run db:push    # creates the tables in Neon
npm run dev        # http://localhost:3000
```

## How sending works

1. Creating a campaign snapshots the sheet rows into the database (invalid emails are skipped).
2. Pressing send filters out anyone on the suppression list, renders subject and body per recipient, and sends in batches of 100 through Resend's batch endpoint with idempotency keys and backoff on rate limits.
3. Each email carries a `recipient_id` tag plus `List-Unsubscribe` headers, and the returned Resend email IDs are stored per recipient.
4. The webhook handler verifies signatures (svix), logs every event, and moves each recipient forward through: sent, delivered, opened, clicked. Bounces and complaints are terminal and the address is added to the suppression list automatically.
5. The campaign page polls every 5 seconds while you watch results come in.

## Things to know

- **Resend free tier**: 100 emails/day and 3,000/month. Larger campaigns need the Pro plan.
- **Open rates are directional**: Apple Mail fires false opens, image-blocking clients fire none. Click data is reliable.
- **Warm up the domain**: a fresh sending subdomain has no reputation. Start with small sends to people who know you.
- **Keep lists clean**: high bounce or complaint rates can get a Resend account suspended. The suppression list is enforced on every send.
- Webhooks can't reach localhost. To test tracking locally, use a tunnel (for example `npx untun@latest tunnel http://localhost:3000`) or test on the deployed app.

## Deploy to Vercel

```bash
npx vercel
```

Then set the environment variables in the Vercel dashboard, update the Google OAuth redirect URI and the Resend webhook URL to the production domain, and redeploy.
