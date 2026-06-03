"use client"

import { useState, useTransition } from "react"
import { getBotGuildChannels, getBotGuildRoles } from "./actions"
import { Loader2 } from "lucide-react"

interface Channel {
  id: string
  name: string
}

interface Role {
  id: string
  name: string
}

interface Guild {
  id: string
  name: string
}

interface DiscordChannelSelectorProps {
  guilds: Guild[]
  initialGuildId: string
  initialChannels: Channel[]
  initialChannelId: string
  initialRoles: Role[]
  initialRoleId: string
  isPremium: boolean
}

export function DiscordChannelSelector({
  guilds,
  initialGuildId,
  initialChannels,
  initialChannelId,
  initialRoles,
  initialRoleId,
  isPremium,
}: DiscordChannelSelectorProps) {
  const [selectedGuildId, setSelectedGuildId] = useState(initialGuildId)
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [selectedChannelId, setSelectedChannelId] = useState(initialChannelId)
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleId)
  const [isPending, startTransition] = useTransition()

  const handleGuildChange = async (guildId: string) => {
    setSelectedGuildId(guildId)
    setSelectedChannelId("")
    setSelectedRoleId("")
    if (!guildId) {
      setChannels([])
      setRoles([])
      return
    }

    startTransition(async () => {
      try {
        const [fetchedChannels, fetchedRoles] = await Promise.all([
          getBotGuildChannels(guildId),
          getBotGuildRoles(guildId),
        ])
        setChannels(fetchedChannels)
        setRoles(fetchedRoles)
        if (fetchedChannels.length > 0) {
          setSelectedChannelId(fetchedChannels[0].id)
        }
        if (fetchedRoles.length > 0) {
          setSelectedRoleId(fetchedRoles[0].id)
        }
      } catch (err) {
        console.error("Failed to load guild channels and roles:", err)
        setChannels([])
        setRoles([])
      }
    })
  }

  return (
    <div className={`space-y-4 ${!isPremium ? "opacity-50 pointer-events-none" : ""}`}>
      {/* 1. Server Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Select Discord Server</label>
        <select
          value={selectedGuildId}
          disabled={!isPremium || guilds.length === 0}
          onChange={(e) => handleGuildChange(e.target.value)}
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none"
        >
          <option value="">-- Choose a Server --</option>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {guilds.length === 0 && isPremium && (
          <p className="text-[10px] text-zinc-500">Your bot is not added to any Discord servers yet.</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 2. Channel Selector */}
        <div className="space-y-2 relative">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            Vouch Channel
            {isPending && <Loader2 size={10} className="animate-spin text-indigo-400" />}
          </label>
          <select
            name="vouchChannelId"
            value={selectedChannelId}
            disabled={!isPremium || !selectedGuildId || channels.length === 0 || isPending}
            onChange={(e) => setSelectedChannelId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none"
          >
            <option value="">-- Choose a Channel --</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
          {selectedGuildId && channels.length === 0 && !isPending && (
            <p className="text-[10px] text-red-500/80">No text channels found in this server.</p>
          )}
        </div>

        {/* 3. Role Selector */}
        <div className="space-y-2 relative">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            Mention Role (Reward)
            {isPending && <Loader2 size={10} className="animate-spin text-indigo-400" />}
          </label>
          <select
            name="vouchRoleId"
            value={selectedRoleId}
            disabled={!isPremium || !selectedGuildId || roles.length === 0 || isPending}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none"
          >
            <option value="">-- Choose a Role --</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                @{r.name}
              </option>
            ))}
          </select>
          {selectedGuildId && roles.length === 0 && !isPending && (
            <p className="text-[10px] text-red-500/80">No assignable roles found in this server.</p>
          )}
        </div>
      </div>
    </div>
  )
}
