import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateProfile } from "./actions"
import { hasActivePremium } from "@/lib/premium"
import { getCheckoutUrl } from "@/lib/payments"
import { EmbedBadgePanel } from "@/components/dashboard/EmbedBadgePanel"
import { AccentColorField } from "./AccentColorField"
import { DangerZone } from "./DangerZone"
import { User, Shield, Palette, Globe, Search, Code2, Brush, ArrowUpRight, ExternalLink, Lock } from "lucide-react"

export default async function ProfileSettingsPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  const isPremium = hasActivePremium(user)
  const checkoutUrl = (session?.user?.id && getCheckoutUrl(session.user.id)) || null
  const baseUrl = (process.env.AUTH_URL || "").replace(/\/$/, "")

  return (
    <div className="max-w-3xl space-y-6 pb-16 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Public Profile</h1>
          <p className="page-subtitle">Manage your public identity, appearance, and domain.</p>
        </div>
        {user?.slug && (
          <a href={`/u/${user.slug}`} target="_blank" className="btn-secondary !py-2 text-[13px]">
            View public profile
            <ExternalLink size={13} className="text-zinc-400" />
          </a>
        )}
      </div>

      <form action={updateProfile} className="space-y-6">
        {/* Public Identity */}
        <section className="card overflow-hidden">
          <div className="card-header">
            <div className="card-icon">
              <User size={15} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="card-title">Public Identity</h2>
              <p className="card-subtitle">How you appear to others on your public profile.</p>
            </div>
          </div>

          <div className="card-body space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="name" className="field-label">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={user?.name || ""}
                  placeholder="John Doe"
                  className="input"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="slug" className="field-label">
                  Profile Slug
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-sm text-zinc-400">
                    /u/
                  </div>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    defaultValue={user?.slug || ""}
                    placeholder="john-doe"
                    className="input pl-10 font-mono"
                  />
                </div>
                <p className="help-text">
                  Your public URL: <span className="font-medium text-zinc-700 dark:text-zinc-300">vouched.to/u/{user?.slug || "your-name"}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Customization */}
        <section className="card overflow-hidden">
          <div className="card-header">
            <div className="card-icon">
              <Palette size={15} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="card-title">Appearance</h2>
              <p className="card-subtitle">Theme, typography and colors for your public page.</p>
            </div>
          </div>

          <div className="card-body space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="profileTheme" className="field-label">
                  Theme
                </label>
                <select
                  id="profileTheme"
                  name="profileTheme"
                  defaultValue={user?.profileTheme || "dark"}
                  className="input appearance-none"
                >
                  <option value="dark">Midnight (Dark)</option>
                  <option value="light">Daylight (Light)</option>
                  <option value="glass" disabled={!isPremium}>Glassmorphism{isPremium ? "" : " — Premium"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profileFontFamily" className="field-label">
                  Font Style
                </label>
                <select
                  id="profileFontFamily"
                  name="profileFontFamily"
                  defaultValue={user?.profileFontFamily || "sans"}
                  className="input appearance-none"
                >
                  <option value="sans">Sans-serif (Default)</option>
                  <option value="serif">Serif (Editorial)</option>
                  <option value="mono">Monospace (Technical)</option>
                </select>
              </div>
            </div>

            <AccentColorField defaultValue={user?.profileAccentColor || "#6366f1"} />

            <div className="space-y-1.5">
              <label htmlFor="profileBannerImage" className="field-label">
                Banner Image URL
              </label>
              <input
                type="url"
                id="profileBannerImage"
                name="profileBannerImage"
                defaultValue={user?.profileBannerImage || ""}
                placeholder="https://example.com/banner.jpg"
                className="input"
              />
              <p className="help-text">Displays as a full-width header image on your public profile.</p>
            </div>
          </div>
        </section>

        {/* Design Studio CTA */}
        {isPremium ? (
          <a
            href="/dashboard/profile/builder"
            className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="card-icon">
                <Brush size={15} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="card-title">Design Studio</h3>
                <p className="card-subtitle mt-0.5">Visual editor with live preview — no CSS knowledge needed.</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400">
              Open <ArrowUpRight size={13} />
            </span>
          </a>
        ) : (
          <a
            href={checkoutUrl ?? "#"}
            className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-zinc-300 dark:hover:border-white/[0.15]"
          >
            <div className="flex items-center gap-3.5">
              <div className="card-icon">
                <Lock size={15} />
              </div>
              <div>
                <h3 className="card-title flex items-center gap-2">
                  Design Studio
                  <span className="chip-indigo">Premium</span>
                </h3>
                <p className="card-subtitle mt-0.5">Visual color &amp; layout editor with live preview.</p>
              </div>
            </div>
            {checkoutUrl && (
              <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400">
                Upgrade <ArrowUpRight size={13} />
              </span>
            )}
          </a>
        )}

        {/* SEO & Domain */}
        <section className="card overflow-hidden">
          <div className="card-header">
            <div className="card-icon">
              <Globe size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="card-title">SEO &amp; Domain</h2>
              <p className="card-subtitle">Control how search engines and custom domains see you.</p>
            </div>
          </div>

          <div className="card-body space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="profileMetaTitle" className="field-label">
                Meta Title
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                <input
                  type="text"
                  id="profileMetaTitle"
                  name="profileMetaTitle"
                  defaultValue={user?.profileMetaTitle || ""}
                  placeholder="My Professional Vouch Profile"
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profileMetaDescription" className="field-label">
                Meta Description
              </label>
              <textarea
                id="profileMetaDescription"
                name="profileMetaDescription"
                defaultValue={user?.profileMetaDescription || ""}
                placeholder="Check out my verified vouches and testimonials..."
                rows={3}
                className="input resize-none"
              />
            </div>

            <div className="space-y-1.5 border-t border-zinc-100 pt-5 dark:border-white/[0.06]">
              <label htmlFor="customDomain" className="field-label flex items-center justify-between">
                Custom Domain
                {!isPremium && <span className="chip-indigo">Premium</span>}
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                <input
                  type="text"
                  id="customDomain"
                  name="customDomain"
                  defaultValue={user?.customDomain || ""}
                  disabled={!isPremium}
                  placeholder="vouch.yourname.com"
                  className="input pl-10"
                />
              </div>
              <p className="help-text">
                Map your own domain to your profile. (CNAME record to{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">cname.vouched.to</span>)
              </p>
            </div>
          </div>

          <div className="card-footer">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Shield size={13} className="text-emerald-500/70" />
              Changes apply to your profile immediately
            </div>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </section>
      </form>

      {/* Embeddable Badge */}
      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="card-icon">
            <Code2 size={15} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="card-title flex items-center gap-2">
              Embeddable Badge
              {!isPremium && <span className="chip-indigo">Premium</span>}
            </h2>
            <p className="card-subtitle">A live image of your rep for forum signatures &amp; listings.</p>
          </div>
        </div>

        <div className="card-body">
          {!user?.slug ? (
            <p className="text-sm text-zinc-500">
              Set a <span className="font-medium text-zinc-700 dark:text-zinc-300">profile slug</span> above and save to
              unlock your embeddable badge.
            </p>
          ) : isPremium ? (
            <EmbedBadgePanel baseUrl={baseUrl} slug={user.slug} name={user.name || user.slug} />
          ) : (
            <a
              href={checkoutUrl ?? "#"}
              className="group flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-white/[0.08] dark:hover:border-white/[0.15]"
            >
              <div className="flex items-center gap-3.5">
                <div className="card-icon">
                  <Lock size={15} />
                </div>
                <div>
                  <h3 className="card-title">Live reputation badge</h3>
                  <p className="card-subtitle mt-0.5">
                    A self-updating image showing your vouch count, rating &amp; verified status — with copy-paste
                    BBCode, HTML &amp; Markdown.
                  </p>
                </div>
              </div>
              {checkoutUrl && (
                <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Upgrade <ArrowUpRight size={13} />
                </span>
              )}
            </a>
          )}
        </div>
      </section>

      <DangerZone />
    </div>
  )
}
