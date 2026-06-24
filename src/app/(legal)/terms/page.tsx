import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Decipher OS",
  description:
    "The terms that govern your use of Decipher OS, operated by CloudSheer Consulting.",
};

const LAST_UPDATED = "June 17, 2026";

export default function TermsAndConditions() {
  return (
    <article>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900">
        Terms and Conditions
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

      <p>
        These Terms and Conditions (the &quot;Terms&quot;) govern your access to
        and use of Decipher OS (the &quot;Service&quot;), operated by
        CloudSheer Consulting (&quot;CloudSheer,&quot; &quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;), based in Brooklyn, New York. By
        signing in to or using the Service, you agree to these Terms. If you do
        not agree, do not use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Decipher OS lets you build personalized email campaigns from a
        Google Sheet and send them through your own Gmail account, with
        scheduling, follow-ups, and reply and bounce tracking. We may add,
        change, or remove features at any time.
      </p>

      <h2>2. Accounts and access</h2>
      <p>
        You access the Service either by signing in with Google or by creating an
        account with your email address and a password. You are responsible for
        keeping your credentials confidential and for all activity that occurs
        under your account. You must provide accurate information and promptly
        update it if it changes. Notify us immediately if you suspect
        unauthorized use of your account.
      </p>

      <h2>3. Acceptable use</h2>
      <p>
        You agree to use the Service lawfully and responsibly. You must not use
        the Service to:
      </p>
      <ul>
        <li>
          Send spam, or send email to recipients who have not consented to hear
          from you where consent is required.
        </li>
        <li>
          Violate any applicable anti-spam or electronic communications law,
          including the CAN-SPAM Act, CASL, GDPR, and similar regulations,
          including requirements to identify yourself, honor unsubscribe
          requests, and include a valid physical address where required.
        </li>
        <li>
          Send content that is unlawful, fraudulent, deceptive, harassing,
          defamatory, or that infringes the rights of others.
        </li>
        <li>
          Distribute malware, phishing, or other harmful or malicious content.
        </li>
        <li>
          Interfere with, disrupt, or attempt to gain unauthorized access to the
          Service, its infrastructure, or other users&apos; data.
        </li>
      </ul>
      <p>
        You are solely responsible for the content of the messages you send and
        for ensuring you have the right to contact your recipients.
      </p>

      <h2>4. Your content and Google data</h2>
      <p>
        You retain all rights to the content you upload, create, or send through
        the Service, including your recipient lists and message templates. You
        grant us the limited right to process this content and the Google data
        you authorize solely to operate the Service for you. Our handling of your
        data is described in our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>5. Third-party services</h2>
      <p>
        The Service relies on third-party platforms, including Google
        (authentication, Gmail, and Google Sheets) and our hosting and database
        providers. Your use of those platforms is also subject to their own
        terms and policies. We are not responsible for the availability or
        actions of third-party services.
      </p>

      <h2>6. Service availability</h2>
      <p>
        We aim to keep the Service available and reliable, but we provide it
        &quot;as is&quot; and &quot;as available,&quot; without warranties of any
        kind. We do not guarantee that the Service will be uninterrupted,
        error-free, or that any email will be delivered, opened, or result in a
        reply.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, CloudSheer will not be liable for
        any indirect, incidental, special, consequential, or punitive damages, or
        for any loss of profits, data, or goodwill, arising out of or related to
        your use of the Service. Our total liability for any claim relating to the
        Service will not exceed the amount you paid us for the Service in the
        twelve months before the claim arose, or one hundred US dollars,
        whichever is greater.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may stop using the Service at any time and request deletion of your
        account as described in our Privacy Policy. We may suspend or terminate
        your access if you violate these Terms or use the Service in a way that
        creates risk or legal exposure for us or others.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. When we do, we will revise
        the &quot;Last updated&quot; date above. Your continued use of the
        Service after changes take effect means you accept the updated Terms.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of New York, without
        regard to its conflict-of-laws rules. Any dispute relating to these Terms
        or the Service will be subject to the exclusive jurisdiction of the
        courts located in New York.
      </p>

      <h2>11. Contact us</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:tools@cloudsheer.com">tools@cloudsheer.com</a>.
      </p>
    </article>
  );
}
