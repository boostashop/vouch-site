import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Authoritative admin check. The session role comes from the JWT, which is only
// refreshed at sign-in — so a revoked admin would keep access (and a freshly
// promoted one wouldn't get it) until they re-logged. Every admin-only surface
// must re-read the role from the DB instead of trusting the token. The proxy's
// JWT-based redirect stays as a cheap first pass; this is the real gate.
export async function getCurrentRole(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  return user?.role ?? null
}

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentRole()) === "ADMIN"
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized")
}
