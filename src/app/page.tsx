import Link from "next/link";
import { CheckCircle, Shield, Zap, Globe, MessageSquare, Star, Trophy, Palette, BadgeCheck, ShieldCheck, Plug, RotateCw, X, Calendar, Code2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthNavButton } from "@/components/auth-nav-button";
import { LogoMark } from "@/components/logo";
import { BetaBanner } from "@/components/beta-banner";

// Render the landing page dynamically on every request (like /dashboard).
//
// It used to be ISR-prerendered (`revalidate = 300`) to emit `s-maxage` for CDN
// caching, but that cache is what broke the page: during a bad deploy the
// prerendered `/` snapshot got poisoned, and because it's served from cache the
// proxy's auth redirect couldn't run consistently (hard navigation 307'd to
// /dashboard while RSC prefetch/soft-nav got the cached 200), which left the
// client router in a broken/blank state for signed-in users. The three COUNT
// queries below are cheap, so rendering fresh per request is the safe default.
// Kept session-agnostic on purpose; the nav button deep-links signed-in users
// to /dashboard.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Pull live platform aggregates for the social-proof bar. Counting in the DB
  // (not loading rows) keeps this cheap; with ISR these run at build + every
  // 5 min, not on every request.
  const [totalVouches, totalProfiles, ratingAgg] = await Promise.all([
    prisma.vouch.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { slug: { not: null } } }),
    prisma.vouch.aggregate({ where: { status: "ACTIVE" }, _avg: { rating: true } }),
  ]);

  const avgRating = ratingAgg._avg.rating ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white selection:bg-indigo-500/30 font-sans">
      {/* Fixed header: beta announcement bar stacked above the nav */}
      <div className="fixed top-0 w-full z-50">
        <BetaBanner />
        <nav className="w-full border-b border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <LogoMark size={32} className="rounded-lg group-hover:scale-105 transition-transform shadow-lg shadow-indigo-600/20" />
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Vouched.to</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <a href="#how" className="hover:text-zinc-900 dark:hover:text-white transition-colors">How it works</a>
              <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</a>
              <Link href="/leaderboard" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Leaderboard</Link>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthNavButton />
            </div>
          </div>
        </div>
        </nav>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <Zap size={14} className="fill-current" />
              <span className="uppercase tracking-wider">Multi-Platform Protection</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] bg-gradient-to-b from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-white dark:to-zinc-500 bg-clip-text text-transparent">
              Your Reputation, <br className="hidden sm:block" /> Secured Forever.
            </h1>

            <p className="max-w-2xl mx-auto text-base md:text-xl text-zinc-600 dark:text-zinc-400 mb-12 leading-relaxed px-4">
              Automatically back up testimonials from Discord and Telegram to a stunning public profile. The ultimate insurance policy for builders.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto bg-indigo-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 text-center text-white"
              >
                Get Started Free
              </Link>

              <Link
                href="#pricing"
                className="w-full sm:w-auto bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all active:scale-95 text-center"
              >
                See Premium Plans
              </Link>
            </div>

            <p className="text-zinc-500 text-xs mt-6 font-medium">
              No password required. Instant magic link login.
            </p>

            {/* Live stats bar */}
            <div className="mt-16 grid grid-cols-3 max-w-2xl mx-auto divide-x divide-zinc-200 dark:divide-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              <Stat value={compact(totalVouches)} label="Vouches backed up" />
              <Stat value={compact(totalProfiles)} label="Trusted profiles" />
              <Stat value={totalVouches > 0 ? `${avgRating.toFixed(1)}★` : "—"} label="Average rating" />
            </div>
          </div>

          {/* Hero product mockup — a stylised public profile + wall of vouches */}
          <div className="mt-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <ProfileMock />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32 border-t border-zinc-200 dark:border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-indigo-500 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4">How it works</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Live in three steps</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">No code, no scraping. Connect your bot and your reputation backs itself up.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <StepCard
              step="01"
              icon={<Plug className="text-indigo-400" />}
              title="Connect your bot"
              description="Drop in your own Discord or Telegram bot token. It runs under your brand — no shared bot, no middleman."
            />
            <StepCard
              step="02"
              icon={<MessageSquare className="text-indigo-400" />}
              title="Collect vouches"
              description="Every testimonial your customers leave is captured, rated, and mirrored to a beautiful public wall in real time."
            />
            <StepCard
              step="03"
              icon={<RotateCw className="text-indigo-400" />}
              title="Restore anywhere"
              description="Banned or starting fresh? Run /restore in a new server to re-post years of history, or just share your profile link."
            />
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32 border-t border-zinc-200 dark:border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Built for Scaling</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">Everything you need to manage, protect, and showcase your professional credibility.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={<Shield className="text-indigo-400" />}
              title="Immutable Backups"
              description="Even if your server gets banned, your reputation stays intact on our secure cloud storage."
            />
            <FeatureCard
              icon={<MessageSquare className="text-indigo-400" />}
              title="Multi-Platform"
              description="Seamlessly sync vouches from Discord and Telegram into one centralized, beautiful feed."
            />
            <FeatureCard
              icon={<BadgeCheck className="text-indigo-400" />}
              title="Verified Ratings"
              description="Every vouch carries a 1–5 star rating and proof image, captured straight from the source — no edits, no fakes."
            />
            <FeatureCard
              icon={<Trophy className="text-indigo-400" />}
              title="Global Leaderboard"
              description="Climb the public rankings of the most-trusted builders and turn your track record into discovery."
            />
            <FeatureCard
              icon={<Code2 className="text-indigo-400" />}
              title="Embeddable Badge"
              description="Drop a live reputation badge into any forum signature or site — your vouch count and rating stay up to date and link straight back to your profile."
            />
            <FeatureCard
              icon={<Globe className="text-indigo-400" />}
              title="Custom Domains"
              description="Host your public profile on your own domain to build a professional brand presence."
            />
          </div>
        </section>

        {/* The "Killer Feature" Section */}
        <section className="bg-zinc-50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-white/5 py-24 md:py-40">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="order-2 lg:order-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 mb-8">
                  <Zap size={24} className="fill-current" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">The <span className="text-indigo-500">/restore</span> Command</h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-10 leading-relaxed">
                  Lost your community? No problem. Invite your custom bot to a new server and run `/restore`. Watch years of work reappear in seconds.
                </p>
                <div className="space-y-5">
                  {[
                    "Rapid sequential re-posting",
                    "Maintains original giver names",
                    "Auto-syncs with web profile",
                    "Smart delays to prevent rate limits"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3.5 text-zinc-700 dark:text-zinc-300 font-medium">
                      <div className="mt-1 flex-shrink-0">
                        <CheckCircle size={20} className="text-green-500" />
                      </div>
                      <span className="text-sm md:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-indigo-500/10 rounded-3xl blur-2xl"></div>
                  <div className="relative bg-zinc-900 dark:bg-black p-6 md:p-10 rounded-3xl border border-zinc-700 dark:border-white/10 font-mono text-[13px] md:text-sm shadow-2xl overflow-hidden">
                    <div className="flex gap-2 mb-8">
                      <div className="w-3 h-3 rounded-full bg-zinc-700 dark:bg-zinc-800" />
                      <div className="w-3 h-3 rounded-full bg-zinc-700 dark:bg-zinc-800" />
                      <div className="w-3 h-3 rounded-full bg-zinc-700 dark:bg-zinc-800" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <span className="text-zinc-500 shrink-0">$</span>
                        <p className="text-zinc-300">/restore <span className="text-indigo-400">channel:#vouches</span></p>
                      </div>
                      <p className="text-indigo-500 font-bold">[SYSTEM] Initializing restoration...</p>
                      <p className="text-zinc-500">[BOT] Found 142 vouches for @spiral.</p>
                      <div className="space-y-1 pl-4 border-l-2 border-zinc-800">
                        <p className="text-zinc-400 text-xs">Restoring Vouch #1... <span className="text-green-500 font-bold">DONE</span></p>
                        <p className="text-zinc-400 text-xs">Restoring Vouch #2... <span className="text-green-500 font-bold">DONE</span></p>
                        <p className="text-zinc-400 text-xs">Restoring Vouch #3... <span className="text-indigo-500 animate-pulse">PENDING</span></p>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden mt-6">
                        <div className="h-full bg-indigo-600 w-1/3 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing / Premium comparison */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-indigo-500 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Start free. Upgrade when you scale.</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">Every account backs up vouches from day one. Go Premium from just <span className="font-bold text-zinc-900 dark:text-white">$1.67/mo</span> to unlock the full professional brand layer — one-time payment, no auto-renew.</p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Premium plans */}
            <div className="grid sm:grid-cols-3 gap-6 md:gap-8 items-stretch">
              <PriceCard plan="premium-30d" duration="30 days" price="2.50" per="$2.50 / month" />
              <PriceCard plan="premium-90d" duration="90 days" price="6" per="$2.00 / month" badge="Most popular" save="Save 20%" highlight />
              <PriceCard plan="premium-365d" duration="365 days" price="20" per="$1.67 / month" badge="Best value" save="Save 33%" />
            </div>

            {/* What every Premium plan unlocks */}
            <div className="mt-10 rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30 p-8 md:p-10">
              <h3 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-500" /> Every Premium plan unlocks
              </h3>
              <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
                <PlanRow ok>Unlimited vouch backups <span className="text-zinc-400 dark:text-zinc-600">(Free caps at 50)</span></PlanRow>
                <PlanRow ok>Embeddable reputation badge for forums &amp; sites</PlanRow>
                <PlanRow ok>Custom domain hosting</PlanRow>
                <PlanRow ok>Design Studio — themes, custom CSS &amp; banners</PlanRow>
                <PlanRow ok>Premium &amp; glass profile themes</PlanRow>
                <PlanRow ok>Dedicated vouch channel &amp; auto-role pings</PlanRow>
                <PlanRow ok>Custom vouch emoji &amp; pinned live stats card</PlanRow>
                <PlanRow ok>One-click data export</PlanRow>
                <PlanRow ok>Renewal &amp; expiry shown in /stats</PlanRow>
                <PlanRow ok>Verified Premium profile badge</PlanRow>
              </ul>
            </div>

            {/* Free tier */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-5 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 md:p-8">
              <div>
                <h4 className="font-bold tracking-tight">Just getting started?</h4>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Start free — Discord &amp; Telegram bot, public profile, star ratings, and up to 50 backed-up vouches. No card needed.</p>
              </div>
              <Link
                href="/auth/signup"
                className="shrink-0 px-6 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-all active:scale-95"
              >
                Get started free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-white/5 py-16 bg-white dark:bg-black px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex items-center gap-2.5">
                <LogoMark size={32} className="rounded-lg" />
                <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Vouched.to</span>
              </div>
              <p className="text-zinc-500 text-sm max-w-xs leading-relaxed font-medium">The reputation standard for digital communities and service providers.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <FooterColumn title="Product" links={[
                { label: "How it works", href: "/#how" },
                { label: "Features", href: "/#features" },
                { label: "Pricing", href: "/#pricing" },
                { label: "Leaderboard", href: "/leaderboard" },
              ]} />
              <FooterColumn title="Legal" links={[
                { label: "Privacy", href: "/legal/privacy" },
                { label: "Terms", href: "/legal/terms" },
                { label: "Cookies", href: "/legal/cookies" },
              ]} />
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-zinc-600">
            <p>© 2026 Vouched.to. Built by Spiral.</p>
            <div className="flex gap-6">
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Server Status: Online</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Compact large counts for the stats bar (1240 → "1.2K").
function compact(n: number): string {
  if (n >= 1000) return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  return n.toString();
}

function Stat({ value, label }: { value: string, label: string }) {
  return (
    <div className="px-4">
      <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{value}</div>
      <div className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function StepCard({ step, icon, title, description }: { step: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="relative p-8 md:p-10 rounded-3xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 hover:border-indigo-500/20 transition-all">
      <span className="absolute top-8 right-8 text-5xl font-black text-zinc-200 dark:text-white/[0.04] tracking-tighter">{step}</span>
      <div className="mb-6 bg-indigo-500/5 w-14 h-14 rounded-2xl flex items-center justify-center border border-indigo-500/10">
        <div className="scale-125">{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-4 tracking-tight text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm md:text-base font-medium">{description}</p>
    </div>
  );
}

function PlanRow({ children, ok }: { children: React.ReactNode, ok?: boolean }) {
  return (
    <li className={`flex items-start gap-3 text-sm font-medium ${ok ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600"}`}>
      <span className="mt-0.5 flex-shrink-0">
        {ok ? <CheckCircle size={18} className="text-green-500" /> : <X size={18} className="text-zinc-300 dark:text-zinc-700" />}
      </span>
      <span>{children}</span>
    </li>
  );
}

// A stylised, static mock of a public profile + wall of vouches for the hero.
function ProfileMock() {
  const vouches = [
    { name: "Marcus", initial: "M", rating: 5, platform: "Discord", comment: "Fast, reliable, and exactly what was promised. Been using their service for months." },
    { name: "Aria", initial: "A", rating: 5, platform: "Telegram", comment: "Top-tier communication. Delivered ahead of schedule — would vouch again." },
    { name: "Devon", initial: "D", rating: 4, platform: "Discord", comment: "Solid work and great support throughout the whole process." },
  ];
  return (
    <div className="relative border border-zinc-300 dark:border-white/10 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900/40 backdrop-blur-sm shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      <div className="relative p-6 md:p-10 text-left">
        {/* Profile header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-indigo-600/20">S</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Spiral</h3>
                <ShieldCheck size={18} className="text-indigo-500" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">vouched.to/u/spiral</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-black">
            <Star size={14} fill="currentColor" /> 4.9
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[{ v: "142", l: "Vouches" }, { v: "4.9", l: "Rating" }, { v: "Top Tier", l: "Standing" }].map((s) => (
            <div key={s.l} className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-white/[0.02] px-4 py-3">
              <div className="text-lg font-extrabold text-zinc-900 dark:text-white">{s.v}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Wall of vouches */}
        <div className="space-y-3">
          {vouches.map((v) => (
            <div key={v.name} className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-white/[0.02] p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-black text-indigo-500">{v.initial}</div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{v.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                      <Calendar size={9} /> {v.platform}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg border border-amber-500/20">
                  <Star size={11} fill="currentColor" /> <span className="text-xs font-black">{v.rating}</span>
                </div>
              </div>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed mt-3">{v.comment}</p>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-zinc-100 dark:from-zinc-900/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function PriceCard({ plan, duration, price, per, badge, save, highlight }: { plan: string, duration: string, price: string, per: string, badge?: string, save?: string, highlight?: boolean }) {
  return (
    <div className={`relative rounded-3xl border p-8 flex flex-col ${highlight ? "border-2 border-indigo-500/40 bg-white dark:bg-zinc-900/50 shadow-2xl shadow-indigo-600/10" : "border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30"}`}>
      {badge && (
        <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30">
          {badge}
        </div>
      )}
      <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
        Premium <ShieldCheck size={16} className="text-indigo-500" />
      </h3>
      <p className="text-sm text-zinc-500 font-medium mt-0.5">{duration} of access</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight">${price}</span>
        <span className="text-zinc-500 font-medium text-sm">one-time</span>
      </div>
      <p className="text-xs text-zinc-500 font-medium mt-2 mb-7">
        {per}{save ? <span className="text-emerald-500 font-bold"> · {save}</span> : null}
      </p>
      {/* /upgrade resolves the session and deep-links a signed-in buyer straight
          to this plan's checkout (carrying their account ref); signed-out
          visitors are asked to sign in first. Keeps this page edge-cacheable. */}
      <Link
        href={`/upgrade?plan=${plan}`}
        className={`mt-auto block w-full text-center py-3.5 rounded-2xl font-bold transition-all active:scale-95 ${highlight ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/30" : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90"}`}
      >
        Choose this plan
      </Link>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 md:p-10 rounded-3xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 hover:border-indigo-500/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        {icon}
      </div>
      <div className="mb-6 bg-indigo-500/5 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border border-indigo-500/10">
        <div className="scale-125">{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-4 tracking-tight text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm md:text-base font-medium">
        {description}
      </p>
    </div>
  )
}

function FooterColumn({ title, links }: { title: string, links: { label: string, href: string }[] }) {
  return (
    <div className="flex flex-col gap-4 text-center md:text-left min-w-[100px]">
      <h4 className="text-zinc-900 dark:text-white text-sm font-bold tracking-wider uppercase">{title}</h4>
      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <Link key={link.label} href={link.href} className="text-zinc-500 hover:text-indigo-400 text-sm font-medium transition-colors">{link.label}</Link>
        ))}
      </div>
    </div>
  )
}
