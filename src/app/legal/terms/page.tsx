import type { Metadata } from "next";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service | Vouched.to",
  description: "The terms that govern your use of Vouched.to.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="June 3, 2026">
      <p>
        This is a placeholder terms of service. It sets out the basic rules of
        using Vouched.to — replace it with reviewed legal copy before launch.
      </p>

      <h2>Using the service</h2>
      <p>
        You may use Vouched.to to back up and showcase genuine testimonials
        collected through your own Discord or Telegram bot. You are responsible
        for the bot tokens you connect and the content your bot forwards.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not upload fraudulent vouches, impersonate others, or use the platform
        to harass, deceive, or distribute unlawful content. We may suspend
        accounts that abuse the service or its bots.
      </p>

      <h2>Free and premium plans</h2>
      <p>
        Free accounts can back up a limited number of vouches. Premium unlocks
        unlimited backups and brand features. Premium is billed through our
        external payments provider and access lapses when a subscription expires.
      </p>

      <h2>Availability</h2>
      <p>
        We aim for high availability but provide the service &ldquo;as is&rdquo;
        without warranties. Your backed-up vouches remain yours; export options
        are available from your dashboard.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms over time. Continued use after an update means
        you accept the revised terms.
      </p>
    </LegalShell>
  );
}
