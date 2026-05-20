import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateBotToken } from "./actions"
import { Shield, Info, Bot, Send } from "lucide-react"

export default async function BotSettingsPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bot Settings</h1>
        <p className="text-zinc-400 mt-1">Configure your custom Discord and Telegram bots.</p>
      </div>

      <div className="grid gap-8">
        {/* Discord Bot Section */}
        <section className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-zinc-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="font-bold">Discord Configuration</h2>
              <p className="text-xs text-zinc-500">Your custom bot instance for Discord servers.</p>
            </div>
          </div>
          
          <form action={updateBotToken} className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="discordToken" className="text-sm font-medium text-zinc-300">
                Bot Token
              </label>
              <input 
                type="password"
                id="discordToken"
                name="discordToken"
                defaultValue={user?.discordBotToken || ""}
                placeholder="MTAyN..."
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
              />
              <div className="flex items-start gap-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                <Info size={14} className="text-indigo-400 mt-0.5" />
                <p className="text-[11px] text-zinc-400 leading-normal">
                  You can find your token in the <strong>Discord Developer Portal</strong> under the &quot;Bot&quot; section. 
                  Ensure the &quot;Message Content Intent&quot; is enabled.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Shield size={14} className="text-green-500/50" />
                Encrypted at rest
              </div>
              <button 
                type="submit"
                className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* Telegram Bot Section */}
        <section className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-zinc-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Send size={20} />
            </div>
            <div>
              <h2 className="font-bold flex items-center gap-2">
                Telegram Configuration
              </h2>
              <p className="text-xs text-zinc-500">Your custom bot instance for Telegram groups.</p>
            </div>
          </div>
          
          <form action={updateBotToken} className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="telegramToken" className="text-sm font-medium text-zinc-300">
                Bot Token
              </label>
              <input 
                type="password"
                id="telegramToken"
                name="telegramToken"
                defaultValue={user?.telegramBotToken || ""}
                placeholder="123456789:ABC..."
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-mono"
              />
              <div className="flex items-start gap-2 p-3 bg-sky-500/5 border border-sky-500/10 rounded-lg">
                <Info size={14} className="text-sky-400 mt-0.5" />
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Create a bot via <strong>@BotFather</strong> on Telegram to get your token. 
                  Make sure to add the bot to your group and give it admin permissions.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Shield size={14} className="text-green-500/50" />
                Encrypted at rest
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit"
                  className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>

          {user?.telegramBotToken && !user.telegramId && (
            <div className="px-6 pb-6">
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">Action Required: Link your account</p>
                    <p className="text-xs text-zinc-400">Run <strong>/start</strong> on your Telegram bot to link your account and enable owner commands.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
