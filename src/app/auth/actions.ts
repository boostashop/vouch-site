"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { Prisma } from "@prisma/client"
import { rateLimit, getClientIp, retryAfterText } from "@/lib/rate-limit"
import { isSignupsPaused } from "@/lib/settings"

const TAKEN_MESSAGE =
  "Those account details are unavailable. Try different ones or sign in."

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/

export async function register(formData: FormData) {
  const email = ((formData.get("email") as string | null) ?? "").trim().toLowerCase()
  const username = ((formData.get("username") as string | null) ?? "").trim()
  const password = (formData.get("password") as string | null) ?? ""

  if (!email || !username || !password) {
    return { error: "Missing required fields" }
  }

  // Beta kill-switch: new account creation can be paused from the admin panel.
  if (await isSignupsPaused()) {
    return { error: "New sign-ups are paused right now. Please check back soon." }
  }

  // Throttle account creation per IP to blunt mass/automated signups.
  const ip = await getClientIp()
  const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.ok) {
    return { error: `Too many sign-up attempts. Please try again in ${retryAfterText(rl.retryAfterMs)}.` }
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." }
  }
  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 3–32 characters: letters, numbers, hyphens or underscores." }
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." }
  }
  // bcrypt silently truncates input past 72 bytes; reject longer rather than
  // hashing a value that differs from what the user thinks they set.
  if (Buffer.byteLength(password, "utf8") > 72) {
    return { error: "Password must be at most 72 characters long." }
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          // Case-insensitive so "Jack" and "jack" can't both register (login
          // lookups are case-insensitive too).
          { username: { equals: username, mode: "insensitive" } },
        ]
      },
      select: { id: true },
    })

    if (existingUser) {
      // Deliberately generic and field-agnostic to limit account enumeration:
      // don't reveal whether it was the email or the username that collided.
      return { error: TAKEN_MESSAGE }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    try {
      await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
        }
      })
    } catch (createErr) {
      // Two simultaneous registrations can both pass the check above and race
      // to insert — the unique constraint catches the loser; show the same
      // friendly message instead of a 500.
      if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
        return { error: TAKEN_MESSAGE }
      }
      throw createErr
    }

    // Optionally sign them in immediately
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." }
        default:
          return { error: "Something went wrong." }
      }
    }
    throw error
  }
}

// Pre-check: verifies password and tells the client whether a TOTP code is
// required before making the full signIn call. Uses a separate rate-limit bucket
// so it doesn't eat into the loginWithCredentials allowance.
export async function verifyPasswordOnly(username: string, password: string) {
  const ip = await getClientIp()
  const rl = rateLimit(`verify:${ip}:${(username || "").toLowerCase()}`, 10, 15 * 60 * 1000)
  if (!rl.ok) {
    return { ok: false as const, error: `Too many attempts. Please try again in ${retryAfterText(rl.retryAfterMs)}.` }
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: username, mode: "insensitive" } },
        { email: { equals: username, mode: "insensitive" } },
      ],
    },
    select: { id: true, password: true, totpEnabled: true },
  })

  // Constant-time rejection to prevent user enumeration via timing
  if (!user?.password) {
    await bcrypt.compare(password, "$2a$12$dummyhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    return { ok: false as const, error: "Invalid username or password" }
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return { ok: false as const, error: "Invalid username or password" }

  return { ok: true as const, requiresTotp: user.totpEnabled }
}

export async function loginWithCredentials(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const totp = (formData.get("totp") as string | null) ?? undefined

  // Throttle credential logins per IP+username to blunt brute-force / stuffing.
  const ip = await getClientIp()
  const rl = rateLimit(`login:${ip}:${(username || "").toLowerCase()}`, 10, 15 * 60 * 1000)
  if (!rl.ok) {
    return { error: `Too many sign-in attempts. Please try again in ${retryAfterText(rl.retryAfterMs)}.` }
  }

  try {
    await signIn("credentials", {
      username,
      password,
      totp,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: totp ? "Invalid 2FA code. Please try again." : "Invalid username or password" }
    }
    throw error
  }
}
