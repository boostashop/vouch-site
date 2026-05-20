import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  User as UserIcon, 
  ChevronRight,
  Menu,
  Bell,
  ShieldAlert
} from "lucide-react"
import { SignOut, MobileSignOut } from "@/components/auth-components"

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
    <div className="flex min-h-screen bg-black font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-64 border-r border-white/5 hidden lg:flex flex-col fixed inset-y-0 left-0 bg-black z-30">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-600/20">V</div>
            <span className="text-xl font-bold tracking-tight text-white">VouchSite</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
          <NavItem href="/dashboard/bot" icon={<Settings size={18} />} label="Bot Settings" />
          <NavItem href="/dashboard/vouches" icon={<MessageSquare size={18} />} label="Vouches" />
          <NavItem href="/dashboard/profile" icon={<UserIcon size={18} />} label="Public Profile" />
          {session.user?.role === "ADMIN" && (
            <NavItem href="/admin" icon={<ShieldAlert size={18} />} label="Admin Panel" />
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-zinc-900/50 mb-4 border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
              <UserIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{session.user?.name || 'User'}</p>
              <p className="text-[10px] text-zinc-500 truncate font-medium uppercase tracking-wider">{session.user?.email}</p>
            </div>
          </div>
          <SignOut />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle (Placeholder - requires client component for state) */}
            <button className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
              <Menu size={20} />
            </button>
            
            <div className="hidden md:flex items-center gap-3 text-sm font-medium">
              <span className="text-zinc-500">Dashboard</span>
              <ChevronRight size={14} className="text-zinc-700" />
              <span className="text-white">Overview</span>
            </div>
            
            <Link href="/dashboard" className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center font-bold text-sm text-white">V</div>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
               <Bell size={18} />
             </button>
             <div className="h-8 w-[1px] bg-white/5 mx-1" />
             {session.user?.image ? (
               <img 
                 src={session.user.image} 
                 alt="Profile" 
                 className="w-8 h-8 rounded-full border border-white/10 shadow-sm"
               />
             ) : (
               <div className="w-8 h-8 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center text-zinc-500">
                 <UserIcon size={14} />
               </div>
             )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Navigation Bar (Bottom) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-white/5 px-4 flex items-center justify-between z-30">
        <MobileNavItem href="/dashboard" icon={<LayoutDashboard size={20} />} active />
        <MobileNavItem href="/dashboard/bot" icon={<Settings size={20} />} />
        <MobileNavItem href="/dashboard/vouches" icon={<MessageSquare size={20} />} />
        {session.user?.role === "ADMIN" ? (
          <MobileNavItem href="/admin" icon={<ShieldAlert size={20} />} />
        ) : (
          <MobileNavItem href="/dashboard/profile" icon={<UserIcon size={20} />} />
        )}
        <MobileSignOut />
      </nav>
      {/* Spacer for bottom nav on mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  )
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-zinc-500 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className={`${active ? "text-white" : "text-zinc-600 group-hover:text-indigo-400"} transition-colors`}>
        {icon}
      </span>
      {label}
    </Link>
  )
}

function MobileNavItem({ href, icon, active = false }: { href: string, icon: React.ReactNode, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`p-3 rounded-xl transition-all ${
        active 
          ? "text-indigo-500" 
          : "text-zinc-600"
      }`}
    >
      {icon}
    </Link>
  )
}
