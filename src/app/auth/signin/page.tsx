import { SignIn } from "@/components/auth-components"
import { Zap } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-2xl mb-4">V</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome to VouchSite</h1>
          <p className="text-zinc-400 mt-2">Sign in or create your account to continue</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-2xl backdrop-blur-sm">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-medium uppercase tracking-wider">
              <Zap size={10} />
              <span>Magic Link Authentication</span>
            </div>
            
            <div>
              <h2 className="text-lg font-bold mb-2">Sign in with Email</h2>
              <p className="text-xs text-zinc-500 mb-6">
                Enter your email address and we'll send you a magic link to sign in instantly. No password required.
              </p>
              <SignIn className="w-full" />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
