import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileBuilder } from "./ProfileBuilder"
import { defaultDarkTokens, defaultLightTokens, DesignTokens } from "@/types/design-tokens"

export default async function DesignStudioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isPremium: true,
      slug: true,
      profileTheme: true,
      profileAccentColor: true,
      profileDesignTokens: true,
    },
  })

  if (!user?.isPremium) redirect("/dashboard/profile")
  if (!user?.slug) redirect("/dashboard/profile")

  const saved = user.profileDesignTokens as DesignTokens | null
  const defaults = user.profileTheme === "light" ? defaultLightTokens : defaultDarkTokens
  const initialTokens: DesignTokens = saved ?? defaults

  return (
    <ProfileBuilder
      slug={user.slug}
      initialTokens={initialTokens}
      accentColor={user.profileAccentColor || "#6366f1"}
    />
  )
}
