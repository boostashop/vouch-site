import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Users, 
  Settings, 
  MessageSquare, 
  ShieldAlert, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  Bell,
  Activity,
  User as UserIcon,
  LayoutDashboard
} from "lucide-react"
import { SignOut, MobileSignOut } from "@/components/auth-components"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen bg-black font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-64 border-r border-white/5 hidden lg:flex flex-col fixed inset-y-0 left-0 bg-black z-30">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-red-600/20">V</div>
            <span className="text-xl font-bold tracking-tight text-white uppercase italic">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem href="/admin" icon={<Activity size={18} />} label="System Pulse" />
          <NavItem href="/admin/users" icon={<Users size={18} />} label="User Management" />
          <NavItem href="/admin/vouches" icon={<MessageSquare size={18} />} label="Vouch Audit" />
          <NavItem href="/admin/settings" icon={<ShieldAlert size={18} />} label="Core Settings" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-zinc-900/50 mb-4 border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/10 flex items-center justify-center text-red-400">
              <ShieldAlert size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{session.user?.name || 'Admin'}</p>
              <p className="text-[10px] text-zinc-500 truncate font-medium uppercase tracking-wider">{session.user?.email}</p>
            </div>
          </div>
          <SignOut />
          <Link 
            href="/dashboard" 
            className="mt-2 w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-indigo-400 hover:text-white hover:bg-indigo-600/10 transition-all border border-indigo-500/10"
          >
            ← Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-4 text-sm font-medium">
             <div className="lg:hidden flex items-center gap-2 mr-2">
               <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center font-bold text-sm text-white">V</div>
             </div>
             <span className="text-zinc-500">Root</span>
             <ChevronRight size={14} className="text-zinc-700" />
             <span className="text-white">Admin Dashboard</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/5 border border-red-500/10">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
               <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live Security</span>
             </div>
             <div className="h-8 w-[1px] bg-white/5 mx-1" />
             {session.user?.image ? (
               <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
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

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-white/5 px-4 flex items-center justify-between z-30">
        <Link href="/admin" className="p-3 text-red-500"><Activity size={20} /></Link>
        <Link href="/admin/users" className="p-3 text-zinc-600"><Users size={20} /></Link>
        <Link href="/admin/vouches" className="p-3 text-zinc-600"><MessageSquare size={20} /></Link>
        <Link href="/dashboard" className="p-3 text-zinc-600"><LayoutDashboard size={20} /></Link>
        <MobileSignOut />
      </nav>
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
          ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
          : "text-zinc-500 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className={`${active ? "text-white" : "text-zinc-600 group-hover:text-red-400"} transition-colors`}>
        {icon}
      </span>
      {label}
    </Link>
  )
}
