import Link from "next/link"
import { ArrowLeft, LifeBuoy } from "lucide-react"
import { NewTicketForm } from "@/components/support/new-ticket-form"

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <Link
          href="/dashboard/support"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to support
        </Link>
        <h1 className="page-title flex items-center gap-2.5">
          <LifeBuoy className="text-indigo-500" size={20} />
          New ticket
        </h1>
        <p className="page-subtitle">Tell us what&rsquo;s going on. The more detail, the faster we can help.</p>
      </div>

      <div className="card card-body">
        <NewTicketForm />
      </div>
    </div>
  )
}
