import { signIn, signOut } from "@/auth"
import { Mail, LogOut } from "lucide-react"

export function SignIn({
  className,
  ...props
}: React.ComponentPropsWithRef<"button">) {
  return (
    <form
      action={async (formData) => {
        "use server"
        const email = formData.get("email")
        await signIn("resend", { email, redirectTo: "/dashboard" })
      }}
      className="flex flex-col sm:flex-row gap-2 w-full max-w-sm"
    >
      <input
        type="email"
        name="email"
        placeholder="name@example.com"
        required
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
      />
      <button 
        type="submit"
        className={`flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20 whitespace-nowrap ${className}`}
      >
        <Mail size={18} />
        Send Magic Link
      </button>
    </form>
  )
}

export function SignOut(props: React.ComponentPropsWithRef<"button">) {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/" })
      }}
      className="w-full"
    >
      <button 
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        {...props}
      >
        <LogOut size={18} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
        Sign Out
      </button>
    </form>
  )
}
