import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | Vouched.to",
  description: "How Vouched.to collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="June 6, 2026">
      <p>
        This policy explains what personal data Vouched.to
        (&ldquo;Vouched.to&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
        why, and the choices you have. It covers our website, dashboard, public
        profiles, and the Discord and Telegram bot service (the
        &ldquo;Service&rdquo;). For data you submit, we are the data controller
        and you can reach us at{" "}
        <a href="mailto:support@vouched.to">support@vouched.to</a>.
      </p>

      <h2>Data we collect</h2>

      <h3>Account &amp; sign-in</h3>
      <p>
        We store the email address you sign in with and, if you set one, a
        password (kept only as a salted hash — never in plain text). Sign-in uses
        a magic link by default, so a password is optional. We also keep session
        and authentication records needed to keep you logged in.
      </p>

      <h3>Profile</h3>
      <p>
        Your public profile details: display name, username, avatar image, URL
        slug, optional custom domain, banner image, theme and design settings,
        and any profile meta title/description you set. This information is public
        by design.
      </p>

      <h3>Bot tokens</h3>
      <p>
        To run a bot on your behalf we store the Discord and/or Telegram bot
        token you provide. Tokens are <strong>encrypted at rest</strong>, used
        solely to operate your bot, and are never displayed back to you in full
        after saving. You can disconnect a bot at any time from your dashboard,
        which removes the stored token.
      </p>

      <h3>Vouches and bot data</h3>
      <p>
        When your bot captures a vouch we store the testimonial and its context:
        the platform (Discord or Telegram), the giver&rsquo;s platform ID and
        display name, the source server/group ID and name, the 1–5 star rating,
        any comment, the proof image, the vouch type, your seller reply, and
        timestamps. We also store moderation-related data you create, such as
        blacklist entries, vouch reports, and per-server bot configuration. Proof
        images are stored on Cloudflare R2.
      </p>

      <h3>Premium &amp; payments</h3>
      <p>
        Premium billing is handled by our external payments provider. We receive
        and store only what we need to enable premium features — a customer
        reference, your premium status, and any expiry date. We never receive or
        store your card details.
      </p>

      <h3>Technical data</h3>
      <p>
        Like any website, our hosting and CDN process basic technical data (such
        as IP address and request logs) to deliver and secure the Service. We
        keep this limited to what is needed for security and reliability — see the{" "}
        <Link href="/legal/cookies">Cookie Policy</Link> for browser storage.
      </p>

      <h2>People who give vouches</h2>
      <p>
        Vouches include information about the customer who left them (their
        platform name/ID and what they wrote). If you connect a bot, you direct
        what it captures and you are responsible for having a lawful basis and any
        consent needed to forward that information to us, and for telling your
        community their vouches may be stored and shown publicly. We process this
        data to provide the backup and profile service on your behalf. If you are
        a vouch giver and want a vouch about you removed, contact the profile
        owner, or email us at{" "}
        <a href="mailto:support@vouched.to">support@vouched.to</a> and we will
        help.
      </p>

      <h2>How and why we use data</h2>
      <ul>
        <li>
          <strong>To provide the Service</strong> — authenticate you, run your
          bot, back up and display vouches, render your public profile and social
          preview images, and power the leaderboard (basis: performance of our
          contract with you).
        </li>
        <li>
          <strong>To operate premium</strong> — enable paid features based on the
          status we receive from the payments provider (basis: contract).
        </li>
        <li>
          <strong>To keep the Service safe and working</strong> — security,
          abuse prevention, moderation of reported content, debugging, and
          analytics limited to service health (basis: our legitimate interests in
          a secure, reliable platform).
        </li>
        <li>
          <strong>To communicate with you</strong> — send sign-in links and
          essential service messages (basis: contract / legitimate interests).
        </li>
        <li>
          <strong>To meet legal obligations</strong> — where the law requires it
          (basis: legal obligation).
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Sharing &amp; service providers</h2>
      <p>
        We share data only with providers that help us run the Service, under
        contracts that limit their use of it:
      </p>
      <ul>
        <li>
          <strong>Resend</strong> — sending sign-in and transactional emails.
        </li>
        <li>
          <strong>Cloudflare</strong> — R2 storage for proof images and banners,
          and CDN/edge delivery and security for the website.
        </li>
        <li>
          <strong>Our payments provider</strong> — processing premium
          subscriptions (it, not us, handles your payment details).
        </li>
        <li>
          <strong>Our hosting and database providers</strong> — running the
          application and storing data.
        </li>
        <li>
          <strong>Discord and Telegram</strong> — your bot interacts with their
          platforms to capture and restore vouches under your control.
        </li>
      </ul>
      <p>
        Some providers may process data outside the UK/EEA; where they do, we rely
        on appropriate safeguards such as Standard Contractual Clauses. We may also
        disclose data if required by law or to protect the Service and its users.
      </p>

      <h2>Public information</h2>
      <p>
        Your profile and the vouches on it are public — that is the point of the
        Service. Public content can be viewed, cached, or indexed by search
        engines and may persist in third-party caches even after you change or
        remove it.
      </p>

      <h2>Retention</h2>
      <p>
        We keep your data while your account is active and as needed to provide
        the Service. When you delete your account or specific content, we remove
        it from the live Service; residual copies may remain in encrypted backups
        for a limited period before they are overwritten. We may retain limited
        records where we have a legal obligation or a legitimate need (for
        example, to prevent abuse).
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on your location (including under UK and EU GDPR), you have the
        right to access, correct, delete, export, or restrict processing of your
        personal data, and to object to certain processing. You can edit much of
        your profile and disconnect bots directly in your dashboard. For account
        deletion or any other request, email{" "}
        <a href="mailto:support@vouched.to">support@vouched.to</a> and we will
        respond within the time the law requires. If you are in the UK or EEA and
        are unhappy with how we handle your data, you can complain to your data
        protection authority — in the UK, the Information Commissioner&rsquo;s
        Office (ico.org.uk).
      </p>

      <h2>Security</h2>
      <p>
        We protect your data with measures appropriate to its sensitivity,
        including encryption of bot tokens at rest, hashed passwords, and access
        controls. No system is perfectly secure, but we work to keep your data
        safe and to respond promptly to any incident.
      </p>

      <h2>Children</h2>
      <p>
        The Service is not intended for anyone under 13, and we do not knowingly
        collect data from them. If you believe a child has provided us data,
        contact us and we will delete it.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. We will revise the &ldquo;last
        updated&rdquo; date above and, for material changes, take reasonable steps
        to let you know.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests about your data? Email{" "}
        <a href="mailto:support@vouched.to">support@vouched.to</a>.
      </p>
    </LegalShell>
  );
}
