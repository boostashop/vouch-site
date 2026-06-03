import type { Metadata } from "next";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | Vouched.to",
  description: "How Vouched.to collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="June 3, 2026">
      <p>
        This is a placeholder privacy policy. It outlines, in plain terms, the
        data Vouched.to handles so the page is honest about scope — replace it
        with reviewed legal copy before launch.
      </p>

      <h2>Information we collect</h2>
      <p>
        We store the email address you sign in with, your public profile details
        (name, username, avatar, slug), and the vouches your own Discord or
        Telegram bot forwards to us — including ratings, comments, giver names,
        and proof images. We never ask for a password.
      </p>

      <h2>Bot tokens</h2>
      <p>
        To run a bot on your behalf we store the bot token you provide. Tokens
        are used solely to operate your bot and are never displayed back to you
        in full after saving. You can disconnect a bot at any time from your
        dashboard.
      </p>

      <h2>How we use your data</h2>
      <p>
        Your data is used to operate the service: backing up vouches, rendering
        your public profile, and powering the leaderboard. We do not sell your
        personal information.
      </p>

      <h2>Payments</h2>
      <p>
        Premium billing is handled by our external payments provider. We receive
        only the subscription status needed to enable premium features — we do
        not store your card details.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Reach out via the support channels listed in
        your dashboard.
      </p>
    </LegalShell>
  );
}
