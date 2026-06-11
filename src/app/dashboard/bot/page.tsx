import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateBotTokens, removeBotToken, generateTelegramLinkCode } from "./actions"
import { hasActivePremium } from "@/lib/premium"
import { tryDecryptSecret } from "@/lib/crypto"
import { Shield, Info, Bot, Send, CheckCircle2, MessageSquare, BarChart3, Lock } from "lucide-react"
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
    <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <FlashToast />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Bot Engine</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 font-medium">Power your reputation with custom bot instances.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-white/5">
          <Link 
            href="/dashboard/bot?tab=discord"
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'discord' 
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            Discord
          </Link>
          <Link 
            href="/dashboard/bot?tab=telegram"
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'telegram' 
                ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            Telegram
          </Link>
        </div>
      </div>

      {activeTab === 'discord' ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
          {/* Discord Setup Guide */}
          <section className="bg-indigo-500/5 border border-indigo-500/10 rounded-[32px] p-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
              <CheckCircle2 className="text-indigo-400" />
              Discord Setup Guide
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">1</div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Create Application</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Go to the <a href="https://discord.com/developers/applications" target="_blank" className="underline text-indigo-500">Portal</a>, create a &quot;New Application&quot;, and navigate to the <strong>Bot</strong> tab.</p>
              </div>
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">2</div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Copy Token</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Click <strong>Reset Token</strong> to reveal it, then paste it below. No privileged intents are required — vouches use slash commands.</p>
              </div>
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">3</div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Invite Bot</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Go to <strong>OAuth2 → URL Generator</strong>. Select <code>bot</code> and <code>applications.commands</code> scopes. Copy the link and invite it!</p>
              </div>
            </div>
          </section>

          {/* Discord Bot Section */}
          <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="font-bold">Discord Configuration</h2>
                <p className="text-xs text-zinc-500">Your custom bot instance for Discord servers.</p>
              </div>
            </div>
            
            <form action={updateBotTokens} className="p-6 space-y-6">
              <div className="space-y-2">
                <label htmlFor="discordToken" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Bot Token
                </label>
                <input
                  type="password"
                  id="discordToken"
                  name="discordToken"
                  autoComplete="off"
                  placeholder={user.discordBotToken ? "•••••••••• — paste a new token to replace" : "MTAyN..."}
                  className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                />
                <div className="flex items-start gap-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                  <Info size={14} className="text-indigo-400 mt-0.5" />
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                    You can find your token in the <strong>Discord Developer Portal</strong> under the &quot;Bot&quot; section.
                    Make sure you invite the bot with the <code>applications.commands</code> scope.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {user.discordBotToken ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Token connected · hidden for security
                    </>
                  ) : (
                    <>
                      <Shield size={14} className="text-zinc-400" />
                      Write-only · never shown after saving
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>

            {user.discordBotToken && (
              <div className="px-6 pb-6">
                <form action={removeBotToken}>
                  <input type="hidden" name="platform" value="discord" />
                  <button type="submit" className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">
                    Disconnect Discord bot
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* Vouch Command Customization */}
          <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="font-bold">Vouch Command Customization</h2>
                <p className="text-xs text-zinc-500">Customize how your /vouch command looks and behaves.</p>
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
          <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <BarChart3 size={20} />
              </div>
              <div className="flex-1">
                <h2 className="font-bold flex items-center gap-2">
                  Stats Command Customization
                  {!isPremium && <Lock size={13} className="text-amber-500" />}
                </h2>
                <p className="text-xs text-zinc-500">Customize your public reputation statistics card.</p>
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
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Telegram Setup Guide */}
          <section className="bg-sky-500/5 border border-sky-500/10 rounded-[32px] p-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
              <Send className="text-sky-400" size={24} />
              Telegram Setup Guide
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 font-black text-sm">1</div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Create Bot</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Message <strong>@BotFather</strong> on Telegram and run <code>/newbot</code>. Follow the steps to get your token.</p>
              </div>
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 font-black text-sm">2</div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Link Account</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Save your token below, generate a link code, then message your bot <code>/link &lt;code&gt;</code> to verify you own this account.</p>
              </div>
            </div>
          </section>

          {/* Telegram Bot Section */}
          <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-sm dark:shadow-none">
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Send size={20} />
              </div>
              <div>
                <h2 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  Telegram Configuration
                </h2>
                <p className="text-xs text-zinc-500">Your custom bot instance for Telegram groups.</p>
              </div>
            </div>
            
            <form action={updateBotTokens} className="p-6 space-y-6">
              <div className="space-y-2">
                <label htmlFor="telegramToken" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Bot Token
                </label>
                <input
                  type="password"
                  id="telegramToken"
                  name="telegramToken"
                  autoComplete="off"
                  placeholder={user.telegramBotToken ? "•••••••••• — paste a new token to replace" : "123456789:ABC..."}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-mono"
                />
                <div className="flex items-start gap-2 p-3 bg-sky-500/5 border border-sky-500/10 rounded-lg">
                  <Info size={14} className="text-sky-400 mt-0.5" />
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                    Create a bot via <strong>@BotFather</strong> on Telegram to get your token. 
                    Make sure to add the bot to your group and give it admin permissions.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {user.telegramBotToken ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Token connected · hidden for security
                    </>
                  ) : (
                    <>
                      <Shield size={14} className="text-zinc-400" />
                      Write-only · never shown after saving
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>

            {user.telegramBotToken && (
              <div className="px-6 pb-2">
                <form action={removeBotToken}>
                  <input type="hidden" name="platform" value="telegram" />
                  <button type="submit" className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">
                    Disconnect Telegram bot
                  </button>
                </form>
              </div>
            )}

            {user?.telegramBotToken && !user.telegramId && (
              <div className="px-6 pb-6">
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <Info size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Action Required: Link your account</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Generate a link code, then message your bot{" "}
                        <strong className="font-mono">/link &lt;code&gt;</strong> to enable owner commands.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-8">
                    {telegramLinkCode ? (
                      <code className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-sm font-mono font-bold text-zinc-900 dark:text-white tracking-widest select-all">
                        /link {telegramLinkCode}
                      </code>
                    ) : null}
                    <form action={generateTelegramLinkCode}>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all active:scale-95"
                      >
                        {telegramLinkCode ? "Regenerate code" : "Generate link code"}
                      </button>
                    </form>
                    {telegramLinkCode && (
                      <span className="text-[10px] text-zinc-500">Expires in 15 min</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Info Card */}
          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Why Telegram?</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Collecting vouches on Telegram is seamless. Once your bot is linked, you can add it to your service groups. 
              Customers can use the <code>/vouch</code> command just like on Discord, and the feedback will sync instantly to your <strong>Vouched.to</strong> profile.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
