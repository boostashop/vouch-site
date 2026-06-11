"use client"

import { signIn, signOut } from "next-auth/react"
import { Mail, LogOut, User, Lock, ArrowRight, ShieldCheck, ChevronLeft } from "lucide-react"
import { useState, useRef } from "react"
import { loginWithCredentials, register, verifyPasswordOnly } from "@/app/auth/actions"

export function SignIn({
  className,
  ...props
}: React.ComponentPropsWithRef<"button">) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn("resend", { email, redirectTo: "/dashboard" })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      <form onSubmit={handleMagicLink} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
            />
          </div>
        </div>
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black h-14 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send Magic Link"}
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  )
}

type SignInPhase = "credentials" | "totp"

export function CredentialsForm({ type = "signin" }: { type?: "signin" | "signup" }) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = useState<SignInPhase>("credentials")
  const [pendingUsername, setPendingUsername] = useState("")
  const [pendingPassword, setPendingPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      if (type === "signup") {
        const result = await register(formData)
        if (result?.error) setError(result.error)
        return
      }

      const username = formData.get("username") as string
      const password = formData.get("password") as string

      const check = await verifyPasswordOnly(username, password)
      if (!check.ok) {
        setError(check.error)
        return
      }

      if (check.requiresTotp) {
        setPendingUsername(username)
        setPendingPassword(password)
        setPhase("totp")
        return
      }

      // No 2FA — sign in directly
      const result = await loginWithCredentials(formData)
      if (result?.error) setError(result.error)
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.set("username", pendingUsername)
      formData.set("password", pendingPassword)
      formData.set("totp", totpCode)
      const result = await loginWithCredentials(formData)
      if (result?.error) setError(result.error)
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (phase === "totp") {
    return (
      <form onSubmit={handleTotpSubmit} className="space-y-5 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
          <ShieldCheck className="text-indigo-400 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">2-Factor Authentication</p>
            <p className="text-xs text-zinc-500 mt-0.5">Open your authenticator app and enter the 6-digit code.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Authentication Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]*"
            maxLength={7}
            placeholder="000 000"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            autoFocus
            autoComplete="one-time-code"
            required
            className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-2xl px-4 py-4 text-xl tracking-[0.4em] font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white h-14 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
        >
          {isLoading ? "Verifying..." : "Verify & Sign In"}
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={() => { setPhase("credentials"); setError(null); setTotpCode("") }}
          className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-medium transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4 w-full">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {type === "signup" && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              name="email"
              type="email"
              placeholder="email@example.com"
              required
              className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
          {type === "signup" ? "Username" : "Username or Email"}
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            name="username"
            type="text"
            placeholder="johndoe"
            required
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={type === "signup" ? 8 : undefined}
            maxLength={type === "signup" ? 72 : undefined}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white h-14 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
      >
        {isLoading ? "Processing..." : type === "signup" ? "Create Account" : "Sign In"}
        <ArrowRight size={18} />
      </button>
    </form>
  )
}

export function SignOut(props: React.ComponentPropsWithRef<"button">) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
      {...props}
    >
      <LogOut size={18} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
      Sign Out
    </button>
  )
}

export function MobileSignOut() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/" })}
      className="p-3 rounded-xl text-zinc-600 hover:text-red-400 transition-all active:scale-90"
    >
      <LogOut size={20} />
    </button>
  )
}
