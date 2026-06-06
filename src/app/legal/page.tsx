import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "./legal-shell";

export const metadata: Metadata = {
  title: "Legal | Vouched.to",
  description: "Vouched.to's terms, privacy, and cookie policies.",
};

const policies = [
  {
    href: "/legal/terms",
    title: "Terms of Service",
    description:
      "The rules for using Vouched.to — accounts, the bots and vouches you connect, acceptable use, and the free and premium plans.",
  },
  {
    href: "/legal/privacy",
    title: "Privacy Policy",
    description:
      "What personal data we collect, how we use and protect it, who we share it with, and the rights you have over it.",
  },
  {
    href: "/legal/cookies",
    title: "Cookie Policy",
    description:
      "The minimal browser storage we rely on to keep you signed in and remember your preferences. No tracking cookies.",
  },
];

export default function LegalIndexPage() {
  return (
    <LegalShell title="Legal" updated="June 6, 2026">
      <p>
        The policies below govern your use of Vouched.to. They&rsquo;re written to
        reflect how the Service actually works — backing up the vouches your
        Discord and Telegram bots collect and publishing them to a profile you
        control.
      </p>

      <div className="not-prose grid gap-4 pt-2">
        {policies.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group block rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30 p-6 transition-all hover:border-indigo-500/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:!no-underline"
          >
            <h2 className="!mt-0 !mb-2 text-lg font-bold tracking-tight text-zinc-900 group-hover:text-indigo-500 dark:text-white dark:group-hover:text-indigo-400">
              {p.title}
            </h2>
            <p className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
              {p.description}
            </p>
          </Link>
        ))}
      </div>

      <h2>Contact</h2>
      <p>
        For anything legal, privacy, or data-related, email{" "}
        <a href="mailto:support@vouched.to">support@vouched.to</a>.
      </p>
    </LegalShell>
  );
}
