"use client"

import { useActionState, useEffect, useRef } from "react"
import { Send, Loader2, Lock } from "lucide-react"
import { TICKET_LIMITS } from "@/lib/tickets"

type State = { error?: string; ok?: boolean } | undefined

/**
 * Reply box shared by the user and admin ticket views. The page passes a bound
 * server action; `allowInternal` adds the staff-only "internal note" toggle.
 */
export function ReplyForm({
  action,
  allowInternal = false,
  placeholder = "Write your reply…",
}: {
  action: (prev: State, formData: FormData) => Promise<State>
  allowInternal?: boolean
  placeholder?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the box once the reply is accepted (the thread re-renders via revalidate).
  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <textarea
        name="message"
        required
        maxLength={TICKET_LIMITS.body}
        rows={4}
        placeholder={placeholder}
        className="input resize-y"
      />
      {state?.error && <p className="text-[13px] text-red-600 dark:text-red-400">{state.error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {allowInternal ? (
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              name="internal"
              value="1"
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 accent-indigo-600 dark:border-white/20"
            />
            <Lock size={13} className="text-amber-500" />
            Internal note — not shown to the user
          </label>
        ) : (
          <span />
        )}
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {pending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </form>
  )
}
