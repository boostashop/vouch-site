"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { DesignTokens } from "@/types/design-tokens"
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
        profileAccentColor,
        profileMetaTitle,
        profileMetaDescription,
        profileTheme: theme,
        profileFontFamily: ["sans", "serif", "mono"].includes(profileFontFamily) ? profileFontFamily : "sans",
        profileBannerImage: profileBannerImage || null,
        customDomain: isPremium ? (customDomain || null) : undefined,
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
    select: { isPremium: true, premiumExpiresAt: true },
  })
  if (!hasActivePremium(user)) throw new Error("Premium required")

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileDesignTokens: tokens as object },
  })

  revalidatePath(`/u/${slug}`)
}
