import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service | Vouched.to",
  description: "The terms that govern your use of Vouched.to.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="June 6, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) are an agreement between you
        and Vouched.to (&ldquo;Vouched.to&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;) governing your access to and use of the Vouched.to
        website, dashboard, public profiles, and the Discord and Telegram bot
        service (together, the &ldquo;Service&rdquo;). By creating an account or
        using the Service you agree to these Terms. If you do not agree, do not
        use the Service.
      </p>

      <h2>1. What Vouched.to does</h2>
      <p>
        Vouched.to is a reputation platform. It backs up the testimonials
        (&ldquo;vouches&rdquo;) your customers leave through a Discord or Telegram
        bot that you connect, and mirrors them to a public profile you control.
        It acts as an off-platform record of your reputation so it survives a
        server ban or a fresh start, and lets you re-post that history with the{" "}
        <code>/restore</code> command.
      </p>

      <h2>2. Eligibility &amp; accounts</h2>
      <ul>
        <li>
          You must be at least 13 years old, and old enough to form a binding
          contract in your country, to use the Service.
        </li>
        <li>
          We sign you in with a magic link sent to your email address, or with an
          email and password if you set one. You are responsible for keeping
          access to that inbox and any password secure, and for all activity
          under your account.
        </li>
        <li>
          You must give accurate account information and keep it up to date. One
          person or organisation may not maintain accounts to evade limits,
          suspensions, or the free-plan caps described below.
        </li>
      </ul>

      <h2>3. Bots and tokens you connect</h2>
      <p>
        The Service runs <strong>your own</strong> Discord and Telegram bots
        using the bot tokens you provide. By connecting a bot you confirm that:
      </p>
      <ul>
        <li>
          you own or are authorised to operate that bot, and that running it
          through Vouched.to does not breach Discord&rsquo;s or Telegram&rsquo;s
          terms or developer policies;
        </li>
        <li>
          you are responsible for the bot&rsquo;s conduct in the servers and
          groups where it operates, including obtaining any consents those
          platforms or your members require;
        </li>
        <li>
          we may run the bot on your behalf, store its token to do so (see the{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>), and stop or restart
          it as needed to operate or protect the Service.
        </li>
      </ul>
      <p>
        You can disconnect a bot at any time from your dashboard. We are not
        affiliated with, endorsed by, or responsible for Discord or Telegram, and
        those platforms&rsquo; own rules continue to apply to you.
      </p>

      <h2>4. Your content and vouches</h2>
      <p>
        &ldquo;Your Content&rdquo; means your profile details and the vouches,
        ratings, comments, replies, and proof images captured through your bot.
        As between you and us, Your Content remains yours. You grant us a
        worldwide, non-exclusive, royalty-free licence to host, store, reproduce,
        and display Your Content for the purpose of operating the Service —
        including rendering your public profile, the leaderboard, and social
        preview images.
      </p>
      <p>
        You are responsible for Your Content and confirm you have the rights and
        any necessary permission to submit it, including from the people who give
        vouches and appear in proof images. Vouches are intended to be a genuine,
        unaltered record: while the platform lets you add a seller reply, you must
        not fabricate, buy, or alter vouches to misrepresent them.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>
          upload fake, purchased, coerced, or fraudulent vouches, or otherwise
          misrepresent your reputation;
        </li>
        <li>
          impersonate any person or organisation, or post another person&rsquo;s
          private information without their consent;
        </li>
        <li>
          harass, threaten, defame, or deceive others, or post unlawful,
          infringing, or sexually exploitative content;
        </li>
        <li>
          promote or facilitate illegal goods or services, fraud, or scams
          through your profile or bot;
        </li>
        <li>
          break, overload, probe, or circumvent the Service, its rate limits, or
          its security — including the vouch limits on free accounts — or access
          accounts or data that are not yours;
        </li>
        <li>scrape or resell the Service except through features we provide.</li>
      </ul>
      <p>
        We may review reported content and remove, flag, or soft-delete vouches,
        and may suspend or terminate accounts or bots that breach these Terms or
        put the Service or its users at risk.
      </p>

      <h2>6. Free and Premium plans</h2>
      <p>
        Every account can back up vouches and publish a public profile for free,
        currently up to <strong>50 backed-up vouches</strong>. Premium removes
        that limit and unlocks the professional brand layer — unlimited backups,
        custom domain hosting, the Design Studio and custom themes, role pings on
        new vouches, and the verified badge.
      </p>
      <ul>
        <li>
          Premium is billed through our external payments provider. Pricing,
          billing terms, renewals, and refunds are presented at checkout and
          handled by that provider; we receive only your subscription status.
        </li>
        <li>
          Premium features stay enabled while your subscription is active and
          lapse when it expires or is cancelled. We do not store your card
          details.
        </li>
        <li>
          We may change plan features and the free-tier limits over time. If a
          change materially reduces a paid feature you are actively using, we will
          make reasonable efforts to give notice.
        </li>
      </ul>

      <h2>7. Custom domains</h2>
      <p>
        Premium lets you serve your public profile on your own domain. You are
        responsible for owning the domain and configuring DNS correctly, and for
        the domain&rsquo;s own registration and renewal. We may refuse or stop
        serving a domain that is used abusively or that infringes someone
        else&rsquo;s rights.
      </p>

      <h2>8. Availability and changes to the Service</h2>
      <p>
        We work to keep the Service reliable but provide it on an &ldquo;as
        is&rdquo; and &ldquo;as available&rdquo; basis. We may add, change, or
        discontinue features, and there may be downtime for maintenance or
        reasons outside our control. The backup service does not replace keeping
        your own records — your vouches remain available to you and you should
        retain your own copies of anything important.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using the Service and ask us to delete your account at any
        time (see the <Link href="/legal/privacy">Privacy Policy</Link> for how).
        We may suspend or terminate your access if you breach these Terms, if
        required by law, or to protect the Service or its users. On termination
        your public profile and bot stop operating; some data may persist in
        backups for a limited period before deletion.
      </p>

      <h2>10. Disclaimers and liability</h2>
      <p>
        To the fullest extent permitted by law, we disclaim all implied
        warranties and are not liable for indirect, incidental, or consequential
        loss, or for loss of profits, goodwill, or data. Nothing in these Terms
        limits liability that cannot be limited by law (such as for death or
        personal injury caused by negligence, or for fraud). Where our liability
        is not excluded, it is limited to the greater of the amount you paid us in
        the 12 months before the claim, or £100. We are not responsible for the
        conduct of vouch givers, your customers, or third-party platforms.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. When we do, we will revise
        the &ldquo;last updated&rdquo; date above and, for material changes, take
        reasonable steps to let you know. Continuing to use the Service after an
        update means you accept the revised Terms.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of England and Wales, and the courts
        of England and Wales have exclusive jurisdiction, except where mandatory
        local consumer law gives you other rights.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms? Email us at{" "}
        <a href="mailto:support@vouched.to">support@vouched.to</a>.
      </p>
    </LegalShell>
  );
}
