import type { Metadata } from "next";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  title: "Cookie Policy | Vouched.to",
  description: "How Vouched.to uses cookies and local storage.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Cookie Policy" updated="June 3, 2026">
      <p>
        This is a placeholder cookie policy describing the small amount of
        browser storage Vouched.to relies on — replace it with reviewed legal
        copy before launch.
      </p>

      <h2>Essential cookies</h2>
      <p>
        We use a session cookie to keep you signed in after you click your magic
        link. Without it, the dashboard and account features cannot work.
      </p>

      <h2>Preferences</h2>
      <p>
        Your light/dark theme choice is saved in your browser&rsquo;s local
        storage so the site remembers it on your next visit. This never leaves
        your device.
      </p>

      <h2>No third-party tracking</h2>
      <p>
        We do not use advertising or cross-site tracking cookies. Any analytics
        we run are limited to what we need to keep the service healthy.
      </p>
    </LegalShell>
  );
}
