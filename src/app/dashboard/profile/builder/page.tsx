import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileBuilder } from "./ProfileBuilder"
import { defaultDarkConfig, defaultLightConfig, ProfileDesignConfig } from "@/types/design-tokens"

export default async function DesignStudioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isPremium: true,
      slug: true,
      profileTheme: true,
      profileDesignTokens: true,
    },
  })

  if (!user?.isPremium) redirect("/dashboard/profile")

  if (!user?.slug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <div className="text-5xl">🎨</div>
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Set a profile slug first</h2>
        <p className="text-zinc-500 max-w-sm">
          You need a public profile URL before you can use the Design Studio.
          Head to Profile Settings and set your slug.
        </p>
        <a
          href="/dashboard/profile"
          className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
        >
          Go to Profile Settings →
        </a>
      </div>
    )
  }

  const defaults = user.profileTheme === "light" ? defaultLightConfig : defaultDarkConfig
  // If saved tokens are missing the new pageBgType field it's an old format — use defaults
  const saved = user.profileDesignTokens as Record<string, unknown> | null
  const initialTokens: ProfileDesignConfig =
    saved && "pageBgType" in saved ? (saved as unknown as ProfileDesignConfig) : defaults

  return (
    <ProfileBuilder
      slug={user.slug}
      initialTokens={initialTokens}
    />
  )
}
