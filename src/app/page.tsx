import Link from "next/link";
import { CheckCircle, Shield, Zap, Globe, MessageSquare, Database } from "lucide-react";
import { SignIn } from "@/components/auth-components";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">V</div>
              <span className="text-xl font-bold tracking-tight">VouchSite</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
            </div>
            <div>
              {session ? (
                <Link href="/dashboard" className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-all active:scale-95">
                  Dashboard
                </Link>
              ) : (
                <SignIn className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-all active:scale-95" />
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full -z-10" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6 animate-fade-in">
            <Zap size={14} />
            <span>Now with Multi-Platform Support</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Your Vouches, <br className="hidden md:block" /> Secured Forever.
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
            The ultimate insurance policy for your reputation. Automatically back up testimonials from Discord and Telegram to a beautiful public profile.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-6">
            {session ? (
              <Link href="/dashboard" className="w-full sm:w-auto bg-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                Go to Dashboard
              </Link>
            ) : (
              <div className="w-full max-w-md">
                <SignIn className="" />
                <p className="text-zinc-500 text-xs mt-4">
                  No password required. We'll email you a magic link to sign in.
                </p>
              </div>
            )}
          </div>

          <div className="mt-20 border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/50 backdrop-blur shadow-2xl">
             {/* Simple Placeholder for App Preview */}
             <div className="h-[400px] flex items-center justify-center text-zinc-700 bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:20px_20px]">
                <p className="text-sm font-mono tracking-widest uppercase">Dashboard Preview Coming Soon</p>
             </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="text-indigo-500" />}
              title="Immutable Backups"
              description="Never lose a vouch again. Even if your server gets nuked, your reputation stays intact on our secure cloud."
            />
            <FeatureCard 
              icon={<Globe className="text-indigo-500" />}
              title="Custom Domains"
              description="Host your vouches on your own domain (e.g., vouches.yourbrand.com) for maximum professionalism."
            />
            <FeatureCard 
              icon={<MessageSquare className="text-indigo-500" />}
              title="Multi-Platform"
              description="Unified profile for Discord and Telegram vouches. Manage everything from one centralized dashboard."
            />
          </div>
        </section>

        {/* The "Killer Feature" Section */}
        <section className="bg-zinc-900/50 border-y border-white/5 py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">The /restore Command</h2>
                <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                  Lost your server? No problem. Invite your custom bot to a new server and run <code className="bg-zinc-800 px-2 py-1 rounded text-indigo-400">/restore</code>. Watch as years of testimonials are instantly re-posted.
                </p>
                <ul className="space-y-4">
                  {[
                    "Rapid sequential re-posting",
                    "Maintains original giver names",
                    "Auto-syncs with web profile",
                    "Customizable delay to avoid bans"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-300">
                      <CheckCircle size={18} className="text-indigo-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-black p-8 rounded-2xl border border-white/10 font-mono text-sm shadow-2xl">
                <div className="flex gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="space-y-2">
                  <p className="text-zinc-500">$ /restore channel:#vouches</p>
                  <p className="text-indigo-400">[SYSTEM] Initializing restoration...</p>
                  <p className="text-zinc-300">[BOT] Found 142 vouches in database.</p>
                  <p className="text-zinc-300">[BOT] Restoring Vouch #1 (from @spiral)... OK</p>
                  <p className="text-zinc-300">[BOT] Restoring Vouch #2 (from @customer)... OK</p>
                  <div className="h-4 w-full bg-zinc-800 rounded overflow-hidden mt-4">
                    <div className="h-full bg-indigo-600 w-1/3 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-sm">V</div>
            <span className="font-bold tracking-tight">VouchSite</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 VouchSite. Built for builders.</p>
          <div className="flex gap-6 text-zinc-400 text-sm">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-indigo-500/20 transition-all group">
      <div className="mb-4 bg-zinc-800 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  )
}
