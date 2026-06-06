// Single source of truth for a user's reputation "standing" tier, derived purely
// from their lifetime vouch count. Used by the public profile and the embeddable
// badge so both always agree on the label.

export function standingLabel(vouchCount: number): string {
  if (vouchCount >= 100) return "Top Tier"
  if (vouchCount >= 25) return "Trusted"
  if (vouchCount >= 5) return "Rising"
  return "New"
}
