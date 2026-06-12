"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { setTicketStatus, setTicketPriority } from "@/app/admin/support/actions"
import { STATUS_VALUES, STATUS_LABEL, PRIORITY_OPTIONS } from "@/lib/tickets"

/** Inline status + priority selects that persist on change via server actions. */
export function TicketAdminControls({
  ticketId,
  status,
  priority,
}: {
  ticketId: string
  status: string
  priority: string
}) {
  const [pending, start] = useTransition()

  return (
    <div className={`flex flex-wrap items-end gap-4 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="space-y-1.5">
        <label className="field-label block">Status</label>
        <select
          defaultValue={status}
          onChange={(e) => start(() => setTicketStatus(ticketId, e.target.value))}
          className="input !py-2 text-[13px]"
        >
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="field-label block">Priority</label>
        <select
          defaultValue={priority}
          onChange={(e) => start(() => setTicketPriority(ticketId, e.target.value))}
          className="input !py-2 text-[13px]"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {pending && <Loader2 size={15} className="mb-2.5 animate-spin text-zinc-400" />}
    </div>
  )
}
