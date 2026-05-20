import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  
  // Basic slug validation (lowercase, alphanumeric, hyphens)
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "")

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        slug: cleanSlug || null,
      }
    })
  } catch (err) {
    // This could fail if slug is not unique
    console.error("Failed to update profile:", err)
    throw new Error("Failed to update profile. Slug might already be taken.")
  }
  
  revalidatePath("/dashboard/profile")
  revalidatePath(`/u/${cleanSlug}`)
}
