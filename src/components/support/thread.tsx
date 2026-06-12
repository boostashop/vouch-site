import { ShieldCheck, User as UserIcon, Lock } from "lucide-react"

export type ThreadMessage = {
  id: string
  authorName: string
  authorRole: "USER" | "ADMIN"
  body: string
  internal: boolean
  createdAt: Date
}

function timeLabel(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Renders a ticket conversation as chat bubbles. The viewer's own messages sit
 * on the right; the other party's on the left. Internal staff notes (only ever
 * passed in for the admin view) get a distinct amber treatment.
 */
export function Thread({ messages, viewerRole }: { messages: ThreadMessage[]; viewerRole: "USER" | "ADMIN" }) {
  return (
    <div className="space-y-4">
      {messages.map((m) => {
        const own = m.authorRole === viewerRole
        const isStaff = m.authorRole === "ADMIN"
        return (
          <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <div className={`mb-1 flex items-center gap-1.5 text-xs text-zinc-500 ${own ? "justify-end" : ""}`}>
                {isStaff ? (
                  <ShieldCheck size={12} className="text-indigo-500" />
                ) : (
                  <UserIcon size={12} className="text-zinc-400" />
                )}
                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                  {isStaff ? "Support" : m.authorName}
                </span>
                {m.internal && (
                  <span className="chip-amber !bg-amber-500/10 !text-amber-600 dark:!text-amber-400">
                    <Lock size={9} />
                    Internal
                  </span>
                )}
                <span className="text-zinc-400 dark:text-zinc-600">· {timeLabel(m.createdAt)}</span>
              </div>
              <div
                className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.internal
                    ? "border border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-200"
                    : own
                      ? "bg-indigo-600 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-200"
                }`}
              >
                {m.body}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
