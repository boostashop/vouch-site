"use client"

import { SignIn, CredentialsForm } from "@/components/auth-components"
import { Zap, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { LogoMark } from "@/components/logo"

export default function SignInPage() {
  const [method, setMethod] = useState<"magic" | "credentials">("magic")

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-6 active:scale-95 transition-transform">
            <LogoMark size={48} className="rounded-xl shadow-xl shadow-indigo-600/20" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Welcome Back</h1>
          <p className="text-zinc-500 mt-2 font-medium">Choose your preferred sign in method</p>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 p-2 rounded-3xl flex gap-1">
          <button
            onClick={() => setMethod("magic")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${method === "magic" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
          >
            <Mail size={16} />
            Magic Link
          </button>
          <button
            onClick={() => setMethod("credentials")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${method === "credentials" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
          >
            <Lock size={16} />
            Password
          </button>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-white/5 p-8 rounded-[32px] backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
            {method === "magic" ? <Mail size={80} /> : <Lock size={80} />}
          </div>
          
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              <Zap size={10} className="fill-current" />
              <span>{method === "magic" ? "Passwordless Auth" : "Secure Credentials"}</span>
            </div>
            
            {method === "magic" ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Sign in with Email</h2>
                  <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                    We'll send a magic link to your inbox for instant, password-free access.
                  </p>
                </div>
                <SignIn />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Sign in with Password</h2>
                  <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                    Enter your username and password to access your dashboard.
                  </p>
                </div>
                <CredentialsForm />
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-500 font-medium">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Create one for free
            </Link>
          </p>
          <p className="text-[10px] text-zinc-700 font-medium leading-relaxed px-8">
            By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
