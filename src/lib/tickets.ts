// Shared, presentation-only constants for the support-ticket UI. Kept free of
// server imports (prisma/email) so it's safe to import from both server and
// client components without leaking server code into the browser bundle.

export const TICKET_LIMITS = {
  subject: 150,
  body: 5000,
} as const

// Categories a user can pick when opening a ticket. Order here is the order
// shown in the dropdown.
export const CATEGORY_OPTIONS = [
  { value: "ISSUE", label: "Issue / Bug" },
  { value: "SUGGESTION", label: "Suggestion" },
  { value: "BILLING", label: "Billing & Premium" },
  { value: "ACCOUNT", label: "Account" },
  { value: "OTHER", label: "Other" },
] as const

export type TicketCategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"]

export const CATEGORY_VALUES = CATEGORY_OPTIONS.map((c) => c.value) as readonly string[]

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.label]),
)

export const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

// Map to the shared `.chip-*` classes from globals.css.
export const STATUS_CHIP: Record<string, string> = {
  OPEN: "chip-sky",
  IN_PROGRESS: "chip-indigo",
  RESOLVED: "chip-emerald",
  CLOSED: "chip-zinc",
}

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const

export const PRIORITY_VALUES = PRIORITY_OPTIONS.map((p) => p.value) as readonly string[]

export const PRIORITY_LABEL: Record<string, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map((p) => [p.value, p.label]),
)

export const STATUS_VALUES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const

// Priority chips. There's no chip-red in the design system, so URGENT overrides
// chip-amber to red the same way the flagged-vouch page does.
export const PRIORITY_CHIP: Record<string, string> = {
  LOW: "chip-zinc",
  NORMAL: "chip-zinc",
  HIGH: "chip-amber",
  URGENT: "chip-amber !bg-red-500/10 !text-red-600 !ring-red-500/20 dark:!text-red-400",
}
