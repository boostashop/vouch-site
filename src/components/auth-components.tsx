"use client"

import { signIn, signOut } from "next-auth/react"
import { Mail, LogOut, User, Lock, ArrowRight } from "lucide-react"
import { useState } from "react"
import { loginWithCredentials, register } from "@/app/auth/actions"

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
              className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
            />
          </div>
        </div>
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-white text-black h-14 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send Magic Link"}
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  )
}

export function CredentialsForm({ type = "signin" }: { type?: "signin" | "signup" }) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = type === "signup" 
        ? await register(formData) 
        : await loginWithCredentials(formData)
      
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
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
              className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
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
