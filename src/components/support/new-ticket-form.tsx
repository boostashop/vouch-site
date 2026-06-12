"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Send, Loader2 } from "lucide-react"
import { createTicket } from "@/app/dashboard/support/actions"
import { CATEGORY_OPTIONS, TICKET_LIMITS } from "@/lib/tickets"

export function NewTicketForm() {
  const [state, formAction, pending] = useActionState(createTicket, undefined)

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="subject" className="field-label block">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          maxLength={TICKET_LIMITS.subject}
          placeholder="A short summary of your issue or idea"
          className="input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="category" className="field-label block">
          Category
        </label>
        <select id="category" name="category" defaultValue="ISSUE" className="input">
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="field-label block">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={TICKET_LIMITS.body}
          rows={7}
          placeholder="Describe what's happening, what you expected, and any steps to reproduce. For suggestions, tell us what you'd love to see."
          className="input resize-y"
        />
        <p className="help-text">Our team will reply by email and here in your dashboard.</p>
      </div>

      {state?.error && <p className="text-[13px] text-red-600 dark:text-red-400">{state.error}</p>}

      <div className="flex items-center justify-end gap-2">
        <Link href="/dashboard/support" className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {pending ? "Submitting…" : "Submit ticket"}
        </button>
      </div>
    </form>
  )
}
