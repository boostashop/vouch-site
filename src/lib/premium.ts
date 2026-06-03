// Single source of truth for "is this user currently a paying premium member?"
//
// Premium state is owned by the external payments site, which pushes updates via
// the /api/payments/webhook endpoint. We mirror that into `isPremium` +
// `premiumExpiresAt`. This helper is the local safety net: even if an "expired"
// webhook is missed, access lapses once the stored expiry passes.

export interface PremiumFields {
  isPremium: boolean
  premiumExpiresAt: Date | null
}

export function hasActivePremium(user: PremiumFields | null | undefined): boolean {
  if (!user?.isPremium) return false
  // No expiry tracked → trust the boolean (payments site controls on/off).
  if (!user.premiumExpiresAt) return true
  return user.premiumExpiresAt.getTime() > Date.now()
}
