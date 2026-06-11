"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { DesignTokens, sanitizeConfig, defaultDarkConfig, defaultLightConfig } from "@/types/design-tokens"
import { hasActivePremium } from "@/lib/premium"

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const profileAccentColor = formData.get("profileAccentColor") as string
  const profileMetaTitle = formData.get("profileMetaTitle") as string
  const profileMetaDescription = formData.get("profileMetaDescription") as string
  const profileTheme = formData.get("profileTheme") as string
  const profileFontFamily = formData.get("profileFontFamily") as string
  const profileBannerImage = formData.get("profileBannerImage") as string
  const customDomain = formData.get("customDomain") as string

  // Basic slug validation (lowercase, alphanumeric, hyphens)
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "")

  // Accent color is interpolated into inline styles on the public profile —
  // only accept a plain 6-digit hex, otherwise fall back to the default.
  const cleanAccent = /^#[0-9a-fA-F]{6}$/.test(profileAccentColor) ? profileAccentColor : "#6366f1"

  // Custom domain (premium): accept a bare hostname only — no scheme, path, or
  // spaces — so it can't smuggle anything into the rewrite/middleware logic.
  const cleanDomain = customDomain?.trim().toLowerCase()
  const validDomain =
    cleanDomain && /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/.test(cleanDomain)
      ? cleanDomain
      : null

  // Only premium users can save custom CSS / custom domain
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isPremium: true, premiumExpiresAt: true } })
  const isPremium = hasActivePremium(user)

  // 'glass' is a premium-only theme; everyone else is limited to dark/light.
  const allowedThemes = isPremium ? ["dark", "light", "glass"] : ["dark", "light"]
  const theme = allowedThemes.includes(profileTheme) ? profileTheme : "dark"

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        slug: cleanSlug || null,
        profileAccentColor: cleanAccent,
        profileMetaTitle,
        profileMetaDescription,
        profileTheme: theme,
        profileFontFamily: ["sans", "serif", "mono"].includes(profileFontFamily) ? profileFontFamily : "sans",
        profileBannerImage: profileBannerImage || null,
        customDomain: isPremium ? validDomain : undefined,
      }
    })
  } catch (err) {
    // This could fail if slug is not unique
    console.error("Failed to update profile:", err)
    throw new Error("Failed to update profile. Slug or Custom Domain might already be taken.")
  }
  
  revalidatePath("/dashboard/profile")
  revalidatePath(`/u/${cleanSlug}`)
}

export async function saveDesignTokens(tokens: DesignTokens, slug: string) {
  "use server"
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true, profileTheme: true },
  })
  if (!hasActivePremium(user)) throw new Error("Premium required")

  // Never store the client payload verbatim: these values are interpolated
  // into a <style> tag on the public profile, so validate/clamp every field.
  const defaults = user!.profileTheme === "light" ? defaultLightConfig : defaultDarkConfig
  const clean = sanitizeConfig(tokens, defaults)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileDesignTokens: clean as object },
  })

  revalidatePath(`/u/${slug}`)
}
