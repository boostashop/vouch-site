import { signIn, signOut } from "@/auth"
import { LogIn, LogOut } from "lucide-react"

export function SignIn({
  provider,
  ...props
}: { provider?: string } & React.ComponentPropsWithRef<"button">) {
  return (
    <form
      action={async () => {
        "use server"
        await signIn(provider)
      }}
    >
      <button 
        {...props}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
      >
        <LogIn size={18} />
        Sign In with Discord
      </button>
    </form>
  )
}

export function SignOut(props: React.ComponentPropsWithRef<"button">) {
  return (
    <form
      action={async () => {
        "use server"
        await signOut()
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
