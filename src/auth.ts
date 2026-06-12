import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import Resend from "next-auth/providers/resend"
import { magicLinkEmail } from "@/lib/email"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { tryDecryptSecret } from "@/lib/crypto"
import { verifyTotpCode } from "@/lib/totp"
import { isSignupsPaused } from "@/lib/settings"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      async sendVerificationRequest({ identifier: to, url, provider }) {
        // Throttle magic-link sends so a target address (or our Resend quota)
        // can't be flooded. Limit per-email and per-IP.
        const ip = await getClientIp().catch(() => "unknown")
        const byEmail = rateLimit(`magiclink:email:${to.toLowerCase()}`, 3, 15 * 60 * 1000)
        const byIp = rateLimit(`magiclink:ip:${ip}`, 8, 15 * 60 * 1000)
        if (!byEmail.ok || !byIp.ok) {
          throw new Error("Too many sign-in link requests. Please wait a few minutes and try again.")
        }

        // Beta kill-switch: when signups are paused, only existing accounts may
        // request a link — a brand-new email can't create an account via the
        // magic-link flow (PrismaAdapter would auto-create one on verify).
        if (await isSignupsPaused()) {
          const existing = await prisma.user.findUnique({
            where: { email: to.toLowerCase() },
            select: { id: true },
          })
          if (!existing) {
            throw new Error("New sign-ups are paused right now. Please check back soon.")
          }
        }

        const { subject, html, text } = magicLinkEmail(url, to)
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: provider.from, to, subject, html, text }),
        })
        if (!res.ok) {
          throw new Error("Resend error: " + JSON.stringify(await res.json()))
        }
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        totp: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const identifier = credentials.username as string
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: { equals: identifier, mode: "insensitive" } },
              { email: { equals: identifier, mode: "insensitive" } }
            ]
          }
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        if (user.totpEnabled) {
          const code = (credentials.totp as string | undefined)?.replace(/\s/g, "")
          if (!code) return null
          const secret = tryDecryptSecret(user.totpSecret)
          if (!secret || !verifyTotpCode(secret, code)) return null
        }

        // Banned accounts cannot sign in (checked after the password/TOTP gate so
        // ban state isn't leaked to someone who doesn't already have the password).
        if (user.bannedAt) return null

        return {
          id: user.id,
          name: user.name || undefined,
          email: user.email || undefined,
          username: user.username || undefined,
          role: user.role as string,
        }
      },
    }),
  ],
  callbacks: {
    // Preserve the edge-safe session/jwt callbacks from authConfig, and add a
    // DB-backed sign-in gate. This runs for every provider (credentials and
    // magic link), so a banned user is refused at the point of sign-in even if
    // they reach it through the email flow (which bypasses `authorize`).
    ...authConfig.callbacks,
    async signIn({ user }) {
      const email = user?.email
      if (!email) return true
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { bannedAt: true },
      })
      if (existing?.bannedAt) return false
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  debug: process.env.NODE_ENV !== "production",
})
