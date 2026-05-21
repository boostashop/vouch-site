export interface DesignTokens {
  bgColor: string
  cardBg: string
  cardBorder: string
  cardRadius: number
  textPrimary: string
  textSubtle: string
  avatarRadius: number
  glowEnabled: boolean
  glowIntensity: number
  spacing: "compact" | "normal" | "spacious"
}

export const defaultDarkTokens: DesignTokens = {
  bgColor: "#09090b",
  cardBg: "#18181b",
  cardBorder: "#27272a",
  cardRadius: 28,
  textPrimary: "#ffffff",
  textSubtle: "#71717a",
  avatarRadius: 24,
  glowEnabled: true,
  glowIntensity: 15,
  spacing: "normal",
}

export const defaultLightTokens: DesignTokens = {
  bgColor: "#fafafa",
  cardBg: "#ffffff",
  cardBorder: "#e4e4e7",
  cardRadius: 28,
  textPrimary: "#09090b",
  textSubtle: "#71717a",
  avatarRadius: 24,
  glowEnabled: true,
  glowIntensity: 10,
  spacing: "normal",
}

export function tokensToCSS(tokens: DesignTokens): string {
  const padMap = {
    compact: "0.875rem 1.25rem",
    normal: "1.5rem 2rem",
    spacious: "2.25rem 3rem",
  }
  return [
    `#vp { background-color: ${tokens.bgColor} !important; color: ${tokens.textPrimary} !important; }`,
    `#vp .vc-glow-1 { opacity: ${tokens.glowEnabled ? tokens.glowIntensity / 100 : 0} !important; }`,
    `#vp .vc-glow-2 { opacity: ${tokens.glowEnabled ? tokens.glowIntensity / 200 : 0} !important; }`,
    `#vp .vc-card { background-color: ${tokens.cardBg} !important; border-color: ${tokens.cardBorder} !important; border-radius: ${tokens.cardRadius}px !important; padding: ${padMap[tokens.spacing]} !important; }`,
    `#vp .vc-stat { background-color: ${tokens.cardBg} !important; border-color: ${tokens.cardBorder} !important; border-radius: ${Math.min(tokens.cardRadius, 20)}px !important; }`,
    `#vp .vc-avatar { border-radius: ${tokens.avatarRadius >= 9999 ? "50%" : tokens.avatarRadius + "px"} !important; }`,
    `#vp .vc-subtle { color: ${tokens.textSubtle} !important; }`,
  ].join("\n")
}
