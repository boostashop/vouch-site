import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Check, ArrowLeft } from "lucide-react"

// Premium plans. Slugs must match the product slugs on the payments store; the
// per-plan deep link sends the buyer to that product's page on the payments
// site with their account id as `ref` so the purchase provisions premium back.
type Plan = { slug: string; duration: string; price: string; per: string; badge?: string; save?: string; highlight?: boolean }

const PLANS: Plan[] = [
  { slug: "premium-30d", duration: "30 days", price: "2.50", per: "$2.50 / month" },
  { slug: "premium-90d", duration: "90 days", price: "6", per: "$2.00 / month", badge: "Most popular", save: "Save 20%", highlight: true },
  { slug: "premium-365d", duration: "365 days", price: "20", per: "$1.67 / month", badge: "Best value", save: "Save 33%" },
]

const PREMIUM_FEATURES = [
  "Unlimited vouch backups (Free caps at 50)",
  "Embeddable reputation badge for forums & sites",
  "Custom domain hosting",
  "Design Studio — themes, custom CSS & banners",
  "Premium & glass profile themes",
  "Dedicated vouch channel & auto-role pings",
  "Custom vouch emoji & pinned live stats card",
  "One-click data export",
  "Renewal & expiry shown in /stats",
  "Verified Premium profile badge",
]

function planUrl(slug: string, userId: string): string | null {
  const base = process.env.PAYMENTS_URL?.replace(/\/$/, "")
  const store = process.env.PAYMENTS_STORE_SLUG?.trim()
  if (!base || !store) return null
  const url = new URL(`/store/${store}/${slug}`, base)
  url.searchParams.set("ref", userId)
  if (process.env.AUTH_URL) {
    url.searchParams.set("return", `${process.env.AUTH_URL.replace(/\/$/, "")}/dashboard`)
  }
  return url.toString()
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>
}) {
  const sp = searchParams ? await searchParams : {}
  const requested = sp.plan
  const session = await auth()
  const userId = session?.user?.id

  // Signed-in deep link: jump straight to the chosen plan's checkout.
  if (userId && requested && PLANS.some((p) => p.slug === requested)) {
    const url = planUrl(requested, userId)
    if (url) redirect(url)
  }

  const signedIn = !!userId

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <Link href={signedIn ? "/dashboard" : "/"} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-10">
          <ArrowLeft size={16} /> {signedIn ? "Back to dashboard" : "Back home"}
        </Link>

        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-indigo-500 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Upgrade</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">Go Premium</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
            One-time payment, no auto-renew. Pick a plan and you&apos;ll be upgraded automatically within a minute of paying.
          </p>
          {!signedIn && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={16} /> Sign in first so we can link the purchase to your account.
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-6 md:gap-8 items-stretch mb-12">
          {PLANS.map((p) => {
            const url = signedIn ? planUrl(p.slug, userId!) : null
            const href = signedIn ? (url ?? "/dashboard") : `/auth/signin?plan=${p.slug}`
            return (
              <div
                key={p.slug}
                className={`relative rounded-3xl border p-8 flex flex-col ${p.highlight ? "border-2 border-indigo-500/40 bg-zinc-50 dark:bg-zinc-900/50 shadow-2xl shadow-indigo-600/10" : "border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30"} ${requested === p.slug ? "ring-2 ring-indigo-500/50" : ""}`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30">
                    {p.badge}
                  </div>
                )}
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  Premium <ShieldCheck size={16} className="text-indigo-500" />
                </h3>
                <p className="text-sm text-zinc-500 font-medium mt-0.5">{p.duration} of access</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">${p.price}</span>
                  <span className="text-zinc-500 font-medium text-sm">one-time</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-2 mb-7">
                  {p.per}
                  {p.save ? <span className="text-emerald-500 font-bold"> · {p.save}</span> : null}
                </p>
                <a
                  href={href}
                  className={`mt-auto block w-full text-center py-3.5 rounded-2xl font-bold transition-all active:scale-95 ${p.highlight ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/30" : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90"}`}
                >
                  {signedIn ? `Choose ${p.duration}` : "Sign in to continue"}
                </a>
              </div>
            )
          })}
        </div>

        {!signedIn && (
          <p className="text-center text-sm text-zinc-500 mb-12">
            New here?{" "}
            <Link href="/auth/signup" className="text-indigo-500 dark:text-indigo-400 font-bold hover:underline">
              Create a free account
            </Link>{" "}
            first — it only takes a moment.
          </p>
        )}

        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/30 p-8 md:p-10">
          <h3 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-500" /> Every Premium plan unlocks
          </h3>
          <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
