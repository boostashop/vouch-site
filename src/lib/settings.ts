import { prisma } from "@/lib/prisma"

// Small key/value wrapper over the AppSetting table for runtime-toggleable
// global flags (e.g. pausing signups during beta). Values are stored as strings.

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

export const SIGNUPS_PAUSED_KEY = "signups_paused"

export async function isSignupsPaused(): Promise<boolean> {
  return (await getSetting(SIGNUPS_PAUSED_KEY)) === "true"
}
