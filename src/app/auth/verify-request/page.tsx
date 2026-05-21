import { Mail } from "lucide-react"
import Link from "next/link"

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600/20 border border-indigo-600/30 rounded-2xl flex items-center justify-center text-indigo-400 mb-6">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Check your email</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">
            A magic link has been sent to your email address. <br />
            Click the link in the email to sign in to your account.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-zinc-600 dark:text-zinc-500">
            Didn&apos;t receive the email? Check your spam folder or try signing in again with a different email address.
          </p>
        </div>

        <Link 
          href="/" 
          className="inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
