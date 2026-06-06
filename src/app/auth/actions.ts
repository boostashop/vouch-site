"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/

export async function register(formData: FormData) {
  const email = ((formData.get("email") as string | null) ?? "").trim().toLowerCase()
  const username = ((formData.get("username") as string | null) ?? "").trim()
  const password = (formData.get("password") as string | null) ?? ""

  if (!email || !username || !password) {
    return { error: "Missing required fields" }
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
          { username }
        ]
      },
      select: { id: true },
    })

    if (existingUser) {
      // Deliberately generic and field-agnostic to limit account enumeration:
      // don't reveal whether it was the email or the username that collided.
      return { error: "Those account details are unavailable. Try different ones or sign in." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      }
    })

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

export async function loginWithCredentials(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid username or password" }
    }
    throw error
  }
}
