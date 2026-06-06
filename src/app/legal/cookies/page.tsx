import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  title: "Cookie Policy | Vouched.to",
  description: "How Vouched.to uses cookies and local storage.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Cookie Policy" updated="June 6, 2026">
      <p>
        This policy explains the small amount of browser storage Vouched.to
        relies on. We keep it deliberately minimal: we do not use advertising or
        cross-site tracking cookies. It should be read alongside our{" "}
        <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>

      <h2>Essential cookies</h2>
      <p>
        When you sign in we set a secure session cookie that keeps you logged in
        and protects against cross-site request forgery. These cookies are
        strictly necessary — without them the dashboard and account features
        cannot work — so they are set without consent and cannot be turned off
        while you are signed in. They are set by Vouched.to (via NextAuth) and
        clear when you sign out or the session expires.
      </p>

      <h2>Preferences</h2>
      <p>
        Your light/dark theme choice is saved in your browser&rsquo;s local
        storage so the site remembers it on your next visit. This stays on your
        device and is never sent to our servers.
      </p>

      <h2>Security &amp; delivery</h2>
      <p>
        Our CDN and security provider, Cloudflare, may set cookies needed to
        route traffic, deliver content from the edge, and protect the Service
        from abuse. These are used only to operate and secure the site, not to
        profile you.
      </p>

      <h2>No third-party tracking</h2>
      <p>
        We do not run advertising networks or cross-site tracking cookies. Any
        analytics we use are limited to aggregate measures that help us keep the
        Service healthy.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can clear or block cookies in your browser settings, and clear local
        storage the same way. Blocking essential cookies will sign you out and
        stop the dashboard from working. Because we don&rsquo;t use tracking
        cookies, there is no separate advertising opt-out to manage.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the Service evolves. We will revise the
        &ldquo;last updated&rdquo; date above when we do.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about cookies? Email{" "}
        <a href="mailto:support@vouched.to">support@vouched.to</a>.
      </p>
    </LegalShell>
  );
}
