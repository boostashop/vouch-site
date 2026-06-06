export interface ProfileDesignConfig {
  // Page background
  pageBg: string
  pageBgType: "solid" | "gradient"
  pageBgGradientTo: string
  pageBgGradientAngle: number   // 0–360

  // Glow
  glowEnabled: boolean
  glowIntensity: number         // 0–30

  // Typography
  fontFamily: "sans" | "serif" | "mono"

  // Name
  nameColor: string
  nameFontSize: number          // px: 28–72
  nameWeight: number            // 400–900
  nameLetterSpacing: number     // hundredths of em: -5 to 10

  // Subtitle / meta
  subtleColor: string

  // Avatar
  avatarRadius: number          // px; 9999 = circle
  avatarBorderColor: string
  avatarBorderWidth: number     // 1–4
  avatarShadow: boolean

  // Vouch cards
  cardBg: string
  cardBorderColor: string
  cardBorderWidth: number       // 1–3
  cardRadius: number            // 0–48
  cardShadow: "none" | "sm" | "md" | "lg"
  cardPadding: number           // rem: 0.75–3

  // Comment text inside cards
  cardCommentColor: string
  cardCommentSize: number       // px: 12–18

  // Rating badge on cards
  ratingBg: string
  ratingColor: string
  ratingBorderColor: string
  ratingRadius: number          // px

  // Stat mini-cards
  statBg: string
  statBorderColor: string
  statRadius: number
  statLabelColor: string
  statValueColor: string

  // Earned badge chips
  badgeBg: string
  badgeBorderColor: string
  badgeTextColor: string
  badgeRadius: number

  // "Get Your Profile" CTA button
  ctaBg: string
  ctaTextColor: string
  ctaRadius: number

  // Section dividers
  dividerColor: string
}

// ── Defaults ──────────────────────────────────────────────────────────────

export const defaultDarkConfig: ProfileDesignConfig = {
  pageBg: "#09090b",
  pageBgType: "solid",
  pageBgGradientTo: "#18181b",
  pageBgGradientAngle: 135,
  glowEnabled: true,
  glowIntensity: 15,
  fontFamily: "sans",
  nameColor: "#ffffff",
  nameFontSize: 48,
  nameWeight: 800,
  nameLetterSpacing: -2,
  subtleColor: "#71717a",
  avatarRadius: 24,
  avatarBorderColor: "#3f3f46",
  avatarBorderWidth: 1,
  avatarShadow: true,
  cardBg: "#18181b",
  cardBorderColor: "#27272a",
  cardBorderWidth: 1,
  cardRadius: 28,
  cardShadow: "none",
  cardPadding: 1.75,
  cardCommentColor: "#a1a1aa",
  cardCommentSize: 15,
  ratingBg: "rgba(245,158,11,0.1)",
  ratingColor: "#f59e0b",
  ratingBorderColor: "rgba(245,158,11,0.2)",
  ratingRadius: 12,
  statBg: "#18181b",
  statBorderColor: "#27272a",
  statRadius: 16,
  statLabelColor: "#52525b",
  statValueColor: "#ffffff",
  badgeBg: "#18181b",
  badgeBorderColor: "#27272a",
  badgeTextColor: "#ffffff",
  badgeRadius: 12,
  ctaBg: "#6366f1",
  ctaTextColor: "#ffffff",
  ctaRadius: 16,
  dividerColor: "rgba(255,255,255,0.06)",
}

export const defaultLightConfig: ProfileDesignConfig = {
  pageBg: "#fafafa",
  pageBgType: "solid",
  pageBgGradientTo: "#f0f0f0",
  pageBgGradientAngle: 135,
  glowEnabled: true,
  glowIntensity: 10,
  fontFamily: "sans",
  nameColor: "#09090b",
  nameFontSize: 48,
  nameWeight: 800,
  nameLetterSpacing: -2,
  subtleColor: "#52525b",
  avatarRadius: 24,
  avatarBorderColor: "#d4d4d8",
  avatarBorderWidth: 1,
  avatarShadow: true,
  cardBg: "#ffffff",
  cardBorderColor: "#e4e4e7",
  cardBorderWidth: 1,
  cardRadius: 28,
  cardShadow: "sm",
  cardPadding: 1.75,
  cardCommentColor: "#3f3f46",
  cardCommentSize: 15,
  ratingBg: "rgba(245,158,11,0.1)",
  ratingColor: "#f59e0b",
  ratingBorderColor: "rgba(245,158,11,0.2)",
  ratingRadius: 12,
  statBg: "#ffffff",
  statBorderColor: "#e4e4e7",
  statRadius: 16,
  statLabelColor: "#71717a",
  statValueColor: "#09090b",
  badgeBg: "#f4f4f5",
  badgeBorderColor: "#e4e4e7",
  badgeTextColor: "#09090b",
  badgeRadius: 12,
  ctaBg: "#6366f1",
  ctaTextColor: "#ffffff",
  ctaRadius: 16,
  dividerColor: "#e4e4e7",
}

// ── CSS generation ─────────────────────────────────────────────────────────

const FONT_MAP: Record<string, string> = {
  sans: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  serif: "Georgia,'Times New Roman',serif",
  mono: "ui-monospace,'Cascadia Code','Source Code Pro',monospace",
}

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 3px rgba(0,0,0,0.12),0 1px 2px rgba(0,0,0,0.06)",
  md: "0 4px 12px rgba(0,0,0,0.15),0 2px 4px rgba(0,0,0,0.08)",
  lg: "0 10px 30px rgba(0,0,0,0.2),0 4px 8px rgba(0,0,0,0.1)",
}

// This string is injected into a <style> element via dangerouslySetInnerHTML on
// the server-rendered public profile. A <style> is a "raw text" element: the
// only way to break out of it (e.g. to inject a <script>) is a literal "</style"
// sequence — HTML entities and comments are NOT parsed inside it. Stripping that
// sequence is therefore a complete defense against breakout for any user-supplied
// token value (colors, fonts, etc.) interpolated into the generated CSS.
export function sanitizeStyleContent(css: string): string {
  return css.replace(/<\/style/gi, "")
}

export function configToCSS(c: ProfileDesignConfig): string {
  const bg =
    c.pageBgType === "gradient"
      ? `linear-gradient(${c.pageBgGradientAngle}deg,${c.pageBg},${c.pageBgGradientTo})`
      : c.pageBg

  const avatarR = c.avatarRadius >= 9999 ? "50%" : `${c.avatarRadius}px`

  const rules = [
    // Root
    `#vp{background:${bg}!important;font-family:${FONT_MAP[c.fontFamily] ?? FONT_MAP.sans}!important}`,

    // Glow
    `#vp .vc-glow-1{opacity:${c.glowEnabled ? c.glowIntensity / 100 : 0}!important}`,
    `#vp .vc-glow-2{opacity:${c.glowEnabled ? c.glowIntensity / 200 : 0}!important}`,

    // Name heading
    `#vp .vc-name{color:${c.nameColor}!important;font-size:${c.nameFontSize}px!important;font-weight:${c.nameWeight}!important;letter-spacing:${c.nameLetterSpacing / 100}em!important}`,

    // Subtitle text
    `#vp .vc-subtle{color:${c.subtleColor}!important}`,

    // Avatar
    `#vp .vc-avatar{border-radius:${avatarR}!important;border-color:${c.avatarBorderColor}!important;border-width:${c.avatarBorderWidth}px!important;box-shadow:${c.avatarShadow ? "0 20px 40px rgba(0,0,0,0.25)" : "none"}!important}`,

    // CTA button
    `#vp .vc-cta{background:${c.ctaBg}!important;color:${c.ctaTextColor}!important;border-radius:${c.ctaRadius}px!important}`,

    // Section divider
    `#vp .vc-divider{border-color:${c.dividerColor}!important}`,

    // Vouch cards
    `#vp .vc-card{background:${c.cardBg}!important;border-color:${c.cardBorderColor}!important;border-width:${c.cardBorderWidth}px!important;border-radius:${c.cardRadius}px!important;box-shadow:${SHADOW_MAP[c.cardShadow]}!important;padding:${c.cardPadding}rem!important}`,

    // Comment text
    `#vp .vc-card-comment{color:${c.cardCommentColor}!important;font-size:${c.cardCommentSize}px!important}`,

    // Rating badge
    `#vp .vc-rating{background:${c.ratingBg}!important;color:${c.ratingColor}!important;border-color:${c.ratingBorderColor}!important;border-radius:${c.ratingRadius}px!important}`,

    // Stat mini-cards
    `#vp .vc-stat{background:${c.statBg}!important;border-color:${c.statBorderColor}!important;border-radius:${c.statRadius}px!important}`,
    `#vp .vc-stat-label{color:${c.statLabelColor}!important}`,
    `#vp .vc-stat-value{color:${c.statValueColor}!important}`,

    // Badge chips
    `#vp .vc-badge{background:${c.badgeBg}!important;border-color:${c.badgeBorderColor}!important;color:${c.badgeTextColor}!important;border-radius:${c.badgeRadius}px!important}`,
  ]

  return sanitizeStyleContent(rules.join("\n"))
}

// Keep old alias for any lingering references
export type DesignTokens = ProfileDesignConfig
export const defaultDarkTokens = defaultDarkConfig
export const defaultLightTokens = defaultLightConfig
export function tokensToCSS(c: ProfileDesignConfig) { return configToCSS(c) }
