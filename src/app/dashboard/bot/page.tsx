import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateBotTokens, removeBotToken, generateTelegramLinkCode } from "./actions"
import { hasActivePremium } from "@/lib/premium"
import { tryDecryptSecret } from "@/lib/crypto"
import { Shield, Info, Bot, Send, MessageSquare, BarChart3, Lock } from "lucide-react"
import Link from "next/link"
import { FlashToast } from "./FlashToast"
import { VouchEmbedCustomizer } from "./VouchEmbedCustomizer"
import { StatsEmbedCustomizer } from "./StatsEmbedCustomizer"

export default async function BotSettingsPage(props: {
  searchParams: Promise<{ tab?: string; saved?: string }>
}) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "discord";

  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!user) return null

  const isPremium = hasActivePremium(user)

  // Pending Telegram link code (generated via the button below), if still valid.
  const telegramLinkCode =
    user.telegramBotToken && !user.telegramId
      ? (
          await prisma.verificationToken.findFirst({
            where: { identifier: `telegram-link:${user.id}`, expires: { gt: new Date() } },
            select: { token: true },
          })
        )?.token ?? null
      : null

  let guilds: any[] = []
  let initialGuildId = ""
  let initialChannels: any[] = []
  let initialRoles: any[] = []

  // Tolerant decrypt: a missing TOKEN_ENCRYPTION_KEY or corrupt row must not
  // 500 the settings page (the user needs this page to fix their token).
  const discordToken = tryDecryptSecret(user.discordBotToken)

  if (discordToken && isPremium) {
    try {
      const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: {
          Authorization: `Bot ${discordToken}`
        },
        next: { revalidate: 60 }
      })
      if (response.ok) {
        guilds = await response.json()
      }
    } catch (err) {
      console.error("Failed to fetch bot guilds:", err)
    }

    if (user.vouchChannelId) {
      try {
        const chanResponse = await fetch(`https://discord.com/api/v10/channels/${user.vouchChannelId}`, {
          headers: {
            Authorization: `Bot ${discordToken}`
          }
        })
        if (chanResponse.ok) {
          const chanData = await chanResponse.json()
          initialGuildId = chanData.guild_id || ""
        }
      } catch (err) {
        console.error("Failed to fetch initial channel:", err)
      }
    }

    if (!initialGuildId && guilds.length > 0) {
      initialGuildId = guilds[0].id
    }

    if (initialGuildId) {
      try {
        const [chansResponse, rolesResponse] = await Promise.all([
          fetch(`https://discord.com/api/v10/guilds/${initialGuildId}/channels`, {
            headers: {
              Authorization: `Bot ${discordToken}`
            }
          }),
          fetch(`https://discord.com/api/v10/guilds/${initialGuildId}/roles`, {
            headers: {
              Authorization: `Bot ${discordToken}`
            }
          })
        ])

        if (chansResponse.ok) {
          const channels = await chansResponse.json()
          initialChannels = channels
            .filter((c: any) => c.type === 0)
            .map((c: any) => ({ id: c.id, name: c.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        }

        if (rolesResponse.ok) {
          const roles = await rolesResponse.json()
          initialRoles = roles
            .filter((r: any) => r.id !== initialGuildId && !r.managed)
            .map((r: any) => ({ id: r.id, name: r.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        }
      } catch (err) {
        console.error("Failed to fetch initial channels and roles concurrently:", err)
      }
    }
  }

  return (
    <div className="max-w-3xl space-y-6 pb-16 animate-in fade-in duration-500">
      <FlashToast />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Bot Settings</h1>
          <p className="page-subtitle">Power your reputation with custom bot instances.</p>
        </div>

        <div className="inline-flex items-center gap-1 self-start rounded-lg border border-zinc-200 bg-white p-1 shadow-[0_1px_2px_0_rgb(0_0_0/0.03)] dark:border-white/[0.08] dark:bg-[#101012] dark:shadow-none">
          <Link
            href="/dashboard/bot?tab=discord"
            className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
              activeTab === 'discord'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-white/[0.08] dark:text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Discord
          </Link>
          <Link
            href="/dashboard/bot?tab=telegram"
            className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
              activeTab === 'telegram'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-white/[0.08] dark:text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Telegram
          </Link>
        </div>
      </div>

      {activeTab === 'discord' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Discord Setup Guide */}
          <section className="card overflow-hidden">
            <div className="card-header">
              <div className="card-icon">
                <Bot size={15} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="card-title">Discord Setup Guide</h2>
                <p className="card-subtitle">Three steps to get your bot collecting vouches.</p>
              </div>
            </div>
            <div className="card-body grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">1</div>
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white">Create Application</h3>
                <p className="help-text">Go to the <a href="https://discord.com/developers/applications" target="_blank" className="font-medium text-indigo-600 underline underline-offset-2 dark:text-indigo-400">Developer Portal</a>, create a &quot;New Application&quot;, and open the <strong>Bot</strong> tab.</p>
              </div>
              <div className="space-y-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">2</div>
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white">Copy Token</h3>
                <p className="help-text">Click <strong>Reset Token</strong> to reveal it, then paste it below. No privileged intents are required — vouches use slash commands.</p>
              </div>
              <div className="space-y-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">3</div>
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white">Invite Bot</h3>
                <p className="help-text">Go to <strong>OAuth2 → URL Generator</strong>. Select <code>bot</code> and <code>applications.commands</code> scopes. Copy the link and invite it!</p>
              </div>
            </div>
          </section>

          {/* Discord Bot Section */}
          <section className="card overflow-hidden">
            <div className="card-header">
              <div className="card-icon">
                <Bot size={15} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="card-title">Discord Configuration</h2>
                <p className="card-subtitle">Your custom bot instance for Discord servers.</p>
              </div>
            </div>

            <form action={updateBotTokens}>
              <div className="card-body space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="discordToken" className="field-label">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    id="discordToken"
                    name="discordToken"
                    autoComplete="off"
                    placeholder={user.discordBotToken ? "•••••••••• — paste a new token to replace" : "MTAyN..."}
                    className="input font-mono"
                  />
                  <div className="flex items-start gap-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.05] p-3">
                    <Info size={13} className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      You can find your token in the <strong>Discord Developer Portal</strong> under the &quot;Bot&quot; section.
                      Make sure you invite the bot with the <code>applications.commands</code> scope.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {user.discordBotToken ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Token connected · hidden for security
                    </>
                  ) : (
                    <>
                      <Shield size={13} className="text-zinc-400" />
                      Write-only · never shown after saving
                    </>
                  )}
                </div>
                <button type="submit" className="btn-primary !py-2 text-[13px]">
                  Save Changes
                </button>
              </div>
            </form>

            {user.discordBotToken && (
              <div className="border-t border-zinc-100 px-5 py-3 dark:border-white/[0.06]">
                <form action={removeBotToken}>
                  <input type="hidden" name="platform" value="discord" />
                  <button type="submit" className="text-xs font-medium text-red-600 transition-colors hover:text-red-500 dark:text-red-400">
                    Disconnect Discord bot
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* Vouch Command Customization */}
          <section className="card overflow-hidden">
            <div className="card-header">
              <div className="card-icon">
                <MessageSquare size={15} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="card-title">Vouch Command Customization</h2>
                <p className="card-subtitle">Customize how your /vouch command looks and behaves.</p>
              </div>
            </div>
            <VouchEmbedCustomizer
              vouchEmbedTitle={user.vouchEmbedTitle}
              vouchEmbedFooter={user.vouchEmbedFooter}
              vouchEmbedColor={user.vouchEmbedColor}
              vouchEmbedDescription={user.vouchEmbedDescription}
              vouchEmbedAuthorName={user.vouchEmbedAuthorName}
              vouchEmbedAuthorIconUrl={user.vouchEmbedAuthorIconUrl}
              vouchEmbedThumbnailUrl={user.vouchEmbedThumbnailUrl}
              vouchEmbedFooterIconUrl={user.vouchEmbedFooterIconUrl}
              vouchEmbedTimestamp={user.vouchEmbedTimestamp}
              vouchRequireProof={user.vouchRequireProof}
              vouchShowCount={user.vouchShowCount}
              vouchTagUser={user.vouchTagUser}
              vouchEmoji={user.vouchEmoji}
              isPremium={isPremium}
              guilds={guilds}
              initialGuildId={initialGuildId}
              initialChannels={initialChannels}
              initialChannelId={user.vouchChannelId || ""}
              initialRoles={initialRoles}
              initialRoleId={user.vouchRoleId || ""}
            />
          </section>

          {/* Stats Command Customization */}
          <section className="card overflow-hidden">
            <div className="card-header">
              <div className="card-icon">
                <BarChart3 size={15} className="text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1">
                <h2 className="card-title flex items-center gap-2">
                  Stats Command Customization
                  {!isPremium && <Lock size={12} className="text-amber-500" />}
                </h2>
                <p className="card-subtitle">Customize your public reputation statistics card.</p>
              </div>
            </div>
            <StatsEmbedCustomizer
              statsEmbedTitle={user.statsEmbedTitle}
              statsEmbedDescription={user.statsEmbedDescription}
              statsEmbedFooter={user.statsEmbedFooter}
              statsEmbedColor={user.statsEmbedColor}
              statsEmbedAuthorName={user.statsEmbedAuthorName}
              statsEmbedAuthorIconUrl={user.statsEmbedAuthorIconUrl}
              statsEmbedThumbnailUrl={user.statsEmbedThumbnailUrl}
              statsEmbedFooterIconUrl={user.statsEmbedFooterIconUrl}
              statsShowCount={user.statsShowCount}
              statsShowScore={user.statsShowScore}
              statsShowLeaderboard={user.statsShowLeaderboard}
              statsShowPlan={user.statsShowPlan}
              statsShowExpiration={user.statsShowExpiration}
              statsShowAge={user.statsShowAge}
              isPremium={isPremium}
            />
          </section>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Telegram Setup Guide */}
          <section className="card overflow-hidden">
            <div className="card-header">
              <div className="card-icon">
                <Send size={15} className="text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h2 className="card-title">Telegram Setup Guide</h2>
                <p className="card-subtitle">Two steps to get your bot collecting vouches.</p>
              </div>
            </div>
            <div className="card-body grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10 text-xs font-semibold text-sky-600 ring-1 ring-inset ring-sky-500/20 dark:text-sky-400">1</div>
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white">Create Bot</h3>
                <p className="help-text">Message <strong>@BotFather</strong> on Telegram and run <code>/newbot</code>. Follow the steps to get your token.</p>
              </div>
              <div className="space-y-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10 text-xs font-semibold text-sky-600 ring-1 ring-inset ring-sky-500/20 dark:text-sky-400">2</div>
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white">Link Account</h3>
                <p className="help-text">Save your token below, generate a link code, then message your bot <code>/link &lt;code&gt;</code> to verify you own this account.</p>
              </div>
            </div>
          </section>

          {/* Telegram Bot Section */}
          <section className="card overflow-hidden">
            <div className="card-header">
              <div className="card-icon">
                <Send size={15} className="text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h2 className="card-title">Telegram Configuration</h2>
                <p className="card-subtitle">Your custom bot instance for Telegram groups.</p>
              </div>
            </div>

            <form action={updateBotTokens}>
              <div className="card-body space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="telegramToken" className="field-label">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    id="telegramToken"
                    name="telegramToken"
                    autoComplete="off"
                    placeholder={user.telegramBotToken ? "•••••••••• — paste a new token to replace" : "123456789:ABC..."}
                    className="input font-mono"
                  />
                  <div className="flex items-start gap-2 rounded-lg border border-sky-500/15 bg-sky-500/[0.05] p-3">
                    <Info size={13} className="mt-0.5 shrink-0 text-sky-500 dark:text-sky-400" />
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      Create a bot via <strong>@BotFather</strong> on Telegram to get your token.
                      Make sure to add the bot to your group and give it admin permissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {user.telegramBotToken ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Token connected · hidden for security
                    </>
                  ) : (
                    <>
                      <Shield size={13} className="text-zinc-400" />
                      Write-only · never shown after saving
                    </>
                  )}
                </div>
                <button type="submit" className="btn-primary !py-2 text-[13px]">
                  Save Changes
                </button>
              </div>
            </form>

            {user.telegramBotToken && (
              <div className="border-t border-zinc-100 px-5 py-3 dark:border-white/[0.06]">
                <form action={removeBotToken}>
                  <input type="hidden" name="platform" value="telegram" />
                  <button type="submit" className="text-xs font-medium text-red-600 transition-colors hover:text-red-500 dark:text-red-400">
                    Disconnect Telegram bot
                  </button>
                </form>
              </div>
            )}

            {user?.telegramBotToken && !user.telegramId && (
              <div className="px-5 pb-5">
                <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-4">
                  <div className="flex items-center gap-3">
                    <Info size={16} className="shrink-0 text-amber-500" />
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">Action required: link your account</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Generate a link code, then message your bot{" "}
                        <strong className="font-mono">/link &lt;code&gt;</strong> to enable owner commands.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-7">
                    {telegramLinkCode ? (
                      <code className="select-all rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono text-sm font-semibold tracking-widest text-zinc-900 dark:border-white/10 dark:bg-black/40 dark:text-white">
                        /link {telegramLinkCode}
                      </code>
                    ) : null}
                    <form action={generateTelegramLinkCode}>
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-black transition-all hover:bg-amber-400 active:scale-[0.98]"
                      >
                        {telegramLinkCode ? "Regenerate code" : "Generate link code"}
                      </button>
                    </form>
                    {telegramLinkCode && (
                      <span className="text-[11px] text-zinc-500">Expires in 15 min</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Info Card */}
          <div className="card p-5">
            <h3 className="card-title">Why Telegram?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Collecting vouches on Telegram is seamless. Once your bot is linked, you can add it to your service groups.
              Customers can use the <code>/vouch</code> command just like on Discord, and the feedback will sync instantly
              to your <strong>Vouched.to</strong> profile.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
