import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  "use server"
  
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
  const profileCustomCSS = formData.get("profileCustomCSS") as string
  const customDomain = formData.get("customDomain") as string

  // Basic slug validation (lowercase, alphanumeric, hyphens)
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "")

  // Only premium users can save custom CSS
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isPremium: true } })

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        slug: cleanSlug || null,
        profileAccentColor,
        profileMetaTitle,
        profileMetaDescription,
        profileTheme,
        profileFontFamily: ["sans", "serif", "mono"].includes(profileFontFamily) ? profileFontFamily : "sans",
        profileBannerImage: profileBannerImage || null,
        profileCustomCSS: user?.isPremium ? (profileCustomCSS || null) : undefined,
        customDomain: customDomain || null,
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
