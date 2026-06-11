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

// ── Validation ──────────────────────────────────────────────────────────────
//
// Token values come from the client and end up interpolated into a <style>
// tag on the public profile, so every field must be validated server-side:
// colors restricted to hex/rgb(a) literals (no url(), no extra declarations),
// numbers clamped to their documented ranges, enums whitelisted. Unknown or
// invalid values fall back to the theme default.

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/
const RGBA_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/

function safeColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && (HEX_RE.test(value) || RGBA_RE.test(value))) return value
  return fallback
}

function safeNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : NaN
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function safeBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function safeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function sanitizeConfig(input: unknown, defaults: ProfileDesignConfig): ProfileDesignConfig {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>
  const d = defaults
  return {
    pageBg: safeColor(raw.pageBg, d.pageBg),
    pageBgType: safeEnum(raw.pageBgType, ["solid", "gradient"] as const, d.pageBgType),
    pageBgGradientTo: safeColor(raw.pageBgGradientTo, d.pageBgGradientTo),
    pageBgGradientAngle: safeNumber(raw.pageBgGradientAngle, 0, 360, d.pageBgGradientAngle),
    glowEnabled: safeBool(raw.glowEnabled, d.glowEnabled),
    glowIntensity: safeNumber(raw.glowIntensity, 0, 30, d.glowIntensity),
    fontFamily: safeEnum(raw.fontFamily, ["sans", "serif", "mono"] as const, d.fontFamily),
    nameColor: safeColor(raw.nameColor, d.nameColor),
    nameFontSize: safeNumber(raw.nameFontSize, 28, 72, d.nameFontSize),
    nameWeight: safeNumber(raw.nameWeight, 400, 900, d.nameWeight),
    nameLetterSpacing: safeNumber(raw.nameLetterSpacing, -5, 10, d.nameLetterSpacing),
    subtleColor: safeColor(raw.subtleColor, d.subtleColor),
    avatarRadius: safeNumber(raw.avatarRadius, 0, 9999, d.avatarRadius),
    avatarBorderColor: safeColor(raw.avatarBorderColor, d.avatarBorderColor),
    avatarBorderWidth: safeNumber(raw.avatarBorderWidth, 1, 4, d.avatarBorderWidth),
    avatarShadow: safeBool(raw.avatarShadow, d.avatarShadow),
    cardBg: safeColor(raw.cardBg, d.cardBg),
    cardBorderColor: safeColor(raw.cardBorderColor, d.cardBorderColor),
    cardBorderWidth: safeNumber(raw.cardBorderWidth, 1, 3, d.cardBorderWidth),
    cardRadius: safeNumber(raw.cardRadius, 0, 48, d.cardRadius),
    cardShadow: safeEnum(raw.cardShadow, ["none", "sm", "md", "lg"] as const, d.cardShadow),
    cardPadding: safeNumber(raw.cardPadding, 0.75, 3, d.cardPadding),
    cardCommentColor: safeColor(raw.cardCommentColor, d.cardCommentColor),
    cardCommentSize: safeNumber(raw.cardCommentSize, 12, 18, d.cardCommentSize),
    ratingBg: safeColor(raw.ratingBg, d.ratingBg),
    ratingColor: safeColor(raw.ratingColor, d.ratingColor),
    ratingBorderColor: safeColor(raw.ratingBorderColor, d.ratingBorderColor),
    ratingRadius: safeNumber(raw.ratingRadius, 0, 48, d.ratingRadius),
    statBg: safeColor(raw.statBg, d.statBg),
    statBorderColor: safeColor(raw.statBorderColor, d.statBorderColor),
    statRadius: safeNumber(raw.statRadius, 0, 48, d.statRadius),
    statLabelColor: safeColor(raw.statLabelColor, d.statLabelColor),
    statValueColor: safeColor(raw.statValueColor, d.statValueColor),
    badgeBg: safeColor(raw.badgeBg, d.badgeBg),
    badgeBorderColor: safeColor(raw.badgeBorderColor, d.badgeBorderColor),
    badgeTextColor: safeColor(raw.badgeTextColor, d.badgeTextColor),
    badgeRadius: safeNumber(raw.badgeRadius, 0, 48, d.badgeRadius),
    ctaBg: safeColor(raw.ctaBg, d.ctaBg),
    ctaTextColor: safeColor(raw.ctaTextColor, d.ctaTextColor),
    ctaRadius: safeNumber(raw.ctaRadius, 0, 48, d.ctaRadius),
    dividerColor: safeColor(raw.dividerColor, d.dividerColor),
  }
}

// Keep old alias for any lingering references
export type DesignTokens = ProfileDesignConfig
export const defaultDarkTokens = defaultDarkConfig
export const defaultLightTokens = defaultLightConfig
export function tokensToCSS(c: ProfileDesignConfig) { return configToCSS(c) }
