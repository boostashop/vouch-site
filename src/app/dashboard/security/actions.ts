"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { encryptSecret, decryptSecret, tryDecryptSecret } from "@/lib/crypto"
import {
  generateTotpSecret,
  generateTotpUri,
  generateQrDataUrl,
  verifyTotpCode,
  formatTotpSecret,
} from "@/lib/totp"
import { revalidatePath } from "next/cache"

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  return session.user.id
}

// Step 1 of setup: generate a new secret, persist it as pending, return QR data.
export async function initiateTotpSetup() {
  const userId = await requireUserId()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true, totpEnabled: true },
  })
  if (!user) return { error: "User not found" }
  if (user.totpEnabled) return { error: "2FA is already enabled" }

  const secret = generateTotpSecret()
  const accountName = user.email || user.username || userId
  const uri = generateTotpUri(secret, accountName)
  const qrDataUrl = await generateQrDataUrl(uri)
  const manualCode = formatTotpSecret(secret)

  await prisma.user.update({
    where: { id: userId },
    data: { totpPendingSecret: encryptSecret(secret) },
  })

  return { qrDataUrl, manualCode }
}

// Step 2 of setup: verify the user's code against the pending secret, then enable.
export async function confirmTotpSetup(code: string) {
  const userId = await requireUserId()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpPendingSecret: true, totpEnabled: true },
  })
  if (!user) return { error: "User not found" }
  if (user.totpEnabled) return { error: "2FA is already enabled" }
  if (!user.totpPendingSecret) return { error: "No setup in progress. Please start again." }

  const secret = tryDecryptSecret(user.totpPendingSecret)
  if (!secret) return { error: "Setup session expired. Please start again." }

  if (!verifyTotpCode(secret, code)) {
    return { error: "Incorrect code. Double-check your authenticator app and try again." }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecret: encryptSecret(secret),
      totpEnabled: true,
      totpPendingSecret: null,
    },
  })

  revalidatePath("/dashboard/security")
  return { ok: true }
}

// Disable 2FA after verifying the current TOTP code.
export async function disableTotp(code: string) {
  const userId = await requireUserId()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  })
  if (!user) return { error: "User not found" }
  if (!user.totpEnabled) return { error: "2FA is not enabled" }

  const secret = tryDecryptSecret(user.totpSecret)
  if (!secret) return { error: "Could not verify your code. Contact support." }

  if (!verifyTotpCode(secret, code)) {
    return { error: "Incorrect code. Please try again." }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecret: null, totpPendingSecret: null },
  })

  revalidatePath("/dashboard/security")
  return { ok: true }
}
