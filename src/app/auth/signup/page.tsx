"use client"

import { CredentialsForm } from "@/components/auth-components"
import { Zap, UserPlus } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 shadow-xl shadow-indigo-600/20 active:scale-95 transition-transform">V</Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Get Started</h1>
          <p className="text-zinc-500 mt-2 font-medium">Create your VouchSite account today</p>
        </div>

        <div className="bg-zinc-900/20 border border-white/5 p-8 rounded-[32px] backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
            <UserPlus size={80} />
          </div>
          
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              <Zap size={10} className="fill-current" />
              <span>Instant Reputation Engine</span>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                  Provide your email, username and a secure password to get started.
                </p>
              </div>
              <CredentialsForm type="signup" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-500 font-medium">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Sign in here
            </Link>
          </p>
          <p className="text-[10px] text-zinc-700 font-medium leading-relaxed px-8">
            By creating an account, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
