import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  User as UserIcon, 
  LogOut,
  ChevronRight,
  ShieldCheck
} from "lucide-react"
import { SignOut } from "@/components/auth-components"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl text-white">V</div>
            <span className="text-xl font-bold tracking-tight text-white font-sans">VouchSite</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" active />
          <NavItem href="/dashboard/bot" icon={<Settings size={18} />} label="Bot Settings" />
          <NavItem href="/dashboard/vouches" icon={<MessageSquare size={18} />} label="Vouches" />
          <NavItem href="/dashboard/profile" icon={<UserIcon size={18} />} label="Public Profile" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-zinc-900/50 mb-4 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserIcon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          <SignOut />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Overview</span>
          </div>
          
          <div className="flex items-center gap-4">
             {session.user?.image && (
               <img 
                 src={session.user.image} 
                 alt="Profile" 
                 className="w-8 h-8 rounded-full border border-white/10"
               />
             )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className={`${active ? "text-white" : "text-zinc-500 group-hover:text-indigo-400"} transition-colors`}>
        {icon}
      </span>
      {label}
    </Link>
  )
}
