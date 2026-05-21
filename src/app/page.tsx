import Link from "next/link";
import { CheckCircle, Shield, Zap, Globe, MessageSquare } from "lucide-react";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white selection:bg-indigo-500/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform shadow-lg shadow-indigo-600/20">V</div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">VouchSite</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-4">
              {session ? (
                <Link href="/dashboard" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-md">
                  Dashboard
                </Link>
              ) : (
                <Link href="/auth/signin" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-md">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <Zap size={14} className="fill-current" />
              <span className="uppercase tracking-wider">Multi-Platform Protection</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] bg-gradient-to-b from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-white dark:to-zinc-500 bg-clip-text text-transparent">
              Your Reputation, <br className="hidden sm:block" /> Secured Forever.
            </h1>
            
            <p className="max-w-2xl mx-auto text-base md:text-xl text-zinc-600 dark:text-zinc-400 mb-12 leading-relaxed px-4">
              Automatically back up testimonials from Discord and Telegram to a stunning public profile. The ultimate insurance policy for builders.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
              {session ? (
                <Link href="/dashboard" className="w-full sm:w-auto bg-indigo-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 text-center">
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth/signup" 
                    className="w-full sm:w-auto bg-indigo-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 text-center"
                  >
                    Get Started Free
                  </Link>

                  <Link
                    href="#features"
                    className="w-full sm:w-auto bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all active:scale-95 text-center"
                  >
                    Learn More
                  </Link>
                </>
              )}
            </div>
            
            {!session && (
              <p className="text-zinc-500 text-xs mt-6 font-medium">
                No password required. Instant magic link login.
              </p>
            )}
          </div>

          <div className="mt-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative border border-zinc-300 dark:border-white/10 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900/40 backdrop-blur-sm shadow-2xl aspect-[16/9] md:aspect-auto md:h-[500px]">
                 <div className="absolute inset-0 flex items-center justify-center text-zinc-500 dark:text-zinc-700 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:24px_24px]">
                    <div className="text-center space-y-4 px-6">
                      <div className="inline-block p-4 rounded-full bg-zinc-200 dark:bg-zinc-800/50 mb-2">
                        <LayoutDashboardIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                      </div>
                      <p className="text-xs md:text-sm font-mono tracking-[0.3em] uppercase opacity-50">Interactive Preview Coming Soon</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32 border-t border-zinc-200 dark:border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Built for Scaling</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">Everything you need to manage, protect, and showcase your professional credibility.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard 
              icon={<Shield className="text-indigo-400" />}
              title="Immutable Backups"
              description="Even if your server gets banned, your reputation stays intact on our secure cloud storage."
            />
            <FeatureCard 
              icon={<Globe className="text-indigo-400" />}
              title="Custom Domains"
              description="Host your public profile on your own domain to build a professional brand presence."
            />
            <FeatureCard 
              icon={<MessageSquare className="text-indigo-400" />}
              title="Multi-Platform"
              description="Seamlessly sync vouches from Discord and Telegram into one centralized, beautiful feed."
            />
          </div>
        </section>

        {/* The "Killer Feature" Section */}
        <section className="bg-zinc-50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-white/5 py-24 md:py-40">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="order-2 lg:order-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 mb-8">
                  <Zap size={24} className="fill-current" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">The <span className="text-indigo-500">/restore</span> Command</h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-10 leading-relaxed">
                  Lost your community? No problem. Invite your custom bot to a new server and run `/restore`. Watch years of work reappear in seconds.
                </p>
                <div className="space-y-5">
                  {[
                    "Rapid sequential re-posting",
                    "Maintains original giver names",
                    "Auto-syncs with web profile",
                    "Smart delays to prevent rate limits"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3.5 text-zinc-700 dark:text-zinc-300 font-medium">
                      <div className="mt-1 flex-shrink-0">
                        <CheckCircle size={20} className="text-green-500" />
                      </div>
                      <span className="text-sm md:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-indigo-500/10 rounded-3xl blur-2xl"></div>
                  <div className="relative bg-zinc-900 dark:bg-black p-6 md:p-10 rounded-3xl border border-zinc-700 dark:border-white/10 font-mono text-[13px] md:text-sm shadow-2xl overflow-hidden">
                    <div className="flex gap-2 mb-8">
                      <div className="w-3 h-3 rounded-full bg-zinc-700 dark:bg-zinc-800" />
                      <div className="w-3 h-3 rounded-full bg-zinc-700 dark:bg-zinc-800" />
                      <div className="w-3 h-3 rounded-full bg-zinc-700 dark:bg-zinc-800" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <span className="text-zinc-500 shrink-0">$</span>
                        <p className="text-zinc-300">/restore <span className="text-indigo-400">channel:#vouches</span></p>
                      </div>
                      <p className="text-indigo-500 font-bold">[SYSTEM] Initializing restoration...</p>
                      <p className="text-zinc-500">[BOT] Found 142 vouches for @spiral.</p>
                      <div className="space-y-1 pl-4 border-l-2 border-zinc-800">
                        <p className="text-zinc-400 text-xs">Restoring Vouch #1... <span className="text-green-500 font-bold">DONE</span></p>
                        <p className="text-zinc-400 text-xs">Restoring Vouch #2... <span className="text-green-500 font-bold">DONE</span></p>
                        <p className="text-zinc-400 text-xs">Restoring Vouch #3... <span className="text-indigo-500 animate-pulse">PENDING</span></p>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden mt-6">
                        <div className="h-full bg-indigo-600 w-1/3 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-white/5 py-16 bg-white dark:bg-black px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">V</div>
                <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">VouchSite</span>
              </div>
              <p className="text-zinc-500 text-sm max-w-xs leading-relaxed font-medium">The reputation standard for digital communities and service providers.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <FooterColumn title="Product" links={["Features", "Pricing", "API Docs"]} />
              <FooterColumn title="Legal" links={["Privacy", "Terms", "Cookies"]} />
              <FooterColumn title="Social" links={["Twitter", "Discord", "GitHub"]} />
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-zinc-600">
            <p>© 2026 VouchSite. Built by Spiral.</p>
            <div className="flex gap-6">
              <p className="hover:text-zinc-400 cursor-pointer transition-colors">Server Status: Online</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 md:p-10 rounded-3xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 hover:border-indigo-500/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        {icon}
      </div>
      <div className="mb-6 bg-indigo-500/5 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border border-indigo-500/10">
        <div className="scale-125">{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-4 tracking-tight text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm md:text-base font-medium">
        {description}
      </p>
    </div>
  )
}

function FooterColumn({ title, links }: { title: string, links: string[] }) {
  return (
    <div className="flex flex-col gap-4 text-center md:text-left min-w-[100px]">
      <h4 className="text-zinc-900 dark:text-white text-sm font-bold tracking-wider uppercase">{title}</h4>
      <div className="flex flex-col gap-3">
        {links.map((link, i) => (
          <a key={i} href="#" className="text-zinc-500 hover:text-indigo-400 text-sm font-medium transition-colors">{link}</a>
        ))}
      </div>
    </div>
  )
}

function LayoutDashboardIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
