import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Cloudsheer Outreach",
  description:
    "How Cloudsheer Outreach collects, uses, stores, and protects your data, including data accessed through Google APIs.",
};

const LAST_UPDATED = "June 17, 2026";

export default function PrivacyPolicy() {
  return (
    <article>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

      <p>
        Cloudsheer Outreach (the &quot;Service&quot;) is operated by CloudSheer
        Consulting (&quot;CloudSheer,&quot; &quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;), based in Brooklyn, New York. This Privacy Policy
        explains what information the Service collects, how we use and protect
        it, and the choices you have. It applies to everyone who signs in to the
        Service, whether you are a member of the CloudSheer team or a client we
        work with.
      </p>
      <p>
        By signing in to or using the Service, you agree to this Privacy Policy.
        If you do not agree, please do not use the Service.
      </p>

      <h2>Information we collect</h2>
      <p>
        We collect only the information needed to run the email outreach
        campaigns you configure.
      </p>
      <ul>
        <li>
          <strong>Account information.</strong> When you sign in with Google, we
          receive your name, email address, and profile picture from your Google
          account. When you sign in with email and password, we store your email
          address and a securely hashed version of your password.
        </li>
        <li>
          <strong>Google Sheets data.</strong> For the specific spreadsheet you
          connect, we read the rows and columns you select (for example
          recipient names, email addresses, and any fields you use to
          personalize messages), and we may write campaign status back into that
          same spreadsheet.
        </li>
        <li>
          <strong>Gmail data.</strong> With your permission, we send the
          campaign emails you compose through your own Gmail account, and we read
          message metadata and content in your mailbox solely to detect replies
          and bounces to those campaigns.
        </li>
        <li>
          <strong>Campaign data.</strong> We store the campaigns you create,
          including subject lines, message templates, recipient lists, schedules,
          and delivery results such as sends, opens, clicks, replies, and
          bounces.
        </li>
      </ul>

      <h2>How we use Google user data</h2>
      <p>
        The Service requests the following Google API scopes, each for a single,
        clearly defined purpose:
      </p>
      <ul>
        <li>
          <strong>Google Sheets (spreadsheets).</strong> To read the recipient
          and personalization data from the spreadsheet you choose, and to write
          campaign status back to it.
        </li>
        <li>
          <strong>Gmail send (gmail.send).</strong> To send the campaign emails
          you create from your own Gmail account, so they come from your real
          address.
        </li>
        <li>
          <strong>Gmail read (gmail.readonly).</strong> To detect when a
          recipient replies or a message bounces, so the Service can stop
          following up and report the result to you.
        </li>
      </ul>
      <p>
        We do not use Google user data for advertising, we do not sell it, and
        we do not use it to train any generalized artificial intelligence or
        machine learning models.
      </p>

      <h2>Limited Use disclosure</h2>
      <p>
        Cloudsheer Outreach&apos;s use and transfer of information received from
        Google APIs to any other app will adhere to the{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>

      <h2>How we store and protect your data</h2>
      <p>
        Data is stored in a managed PostgreSQL database and transmitted over
        encrypted (HTTPS/TLS) connections. Access tokens, refresh tokens, and
        password hashes are stored only as needed to operate the Service and are
        never displayed back to you or shared. We limit access to this data to
        the people and systems that need it to provide and maintain the Service.
      </p>

      <h2>How we share information</h2>
      <p>
        We do not sell your personal information or your Google user data. We
        share data only in these limited cases:
      </p>
      <ul>
        <li>
          <strong>Service providers.</strong> We use trusted infrastructure
          providers to run the Service, including Vercel (application hosting)
          and Neon (database hosting). These providers process data only on our
          instructions and only to operate the Service.
        </li>
        <li>
          <strong>Google APIs.</strong> Sending email and reading sheet and
          mailbox data necessarily involves Google&apos;s own services, which
          process that data under Google&apos;s terms.
        </li>
        <li>
          <strong>Legal requirements.</strong> We may disclose information if
          required by law, regulation, or valid legal process, or to protect the
          rights, safety, and security of CloudSheer, our users, or the public.
        </li>
      </ul>

      <h2>Data retention and deletion</h2>
      <p>
        We retain your data for as long as your account is active or as needed to
        provide the Service. You can:
      </p>
      <ul>
        <li>
          <strong>Revoke access</strong> to your Google account at any time from
          your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noreferrer"
          >
            Google account permissions
          </a>{" "}
          page. Once revoked, the Service can no longer access your Google data.
        </li>
        <li>
          <strong>Request deletion</strong> of your account and associated data
          by emailing us at{" "}
          <a href="mailto:tools@cloudsheer.com">tools@cloudsheer.com</a>.
          We will delete your stored data within 30 days, except where we are
          required to retain it by law.
        </li>
      </ul>

      <h2>Children&apos;s privacy</h2>
      <p>
        The Service is intended for business use and is not directed to children
        under 13. We do not knowingly collect personal information from children.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will
        revise the &quot;Last updated&quot; date above. Significant changes will
        be communicated through the Service or by email where appropriate.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have any questions about this Privacy Policy or how we handle your
        data, contact us at{" "}
        <a href="mailto:tools@cloudsheer.com">tools@cloudsheer.com</a>.
      </p>
    </article>
  );
}
