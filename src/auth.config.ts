import type { NextAuthConfig } from "next-auth"
import Resend from "next-auth/providers/resend"

export default {
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub as string,
        username: token.username as string,
        role: token.role as string,
      },
    }),
    jwt: ({ token, user }) => {
      if (user) {
        token.username = (user as any).username
        token.role = (user as any).role
      }
      return token
    },
  },
} satisfies NextAuthConfig
