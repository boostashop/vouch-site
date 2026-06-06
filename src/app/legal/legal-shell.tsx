import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

// Shared chrome for the legal pages (Terms, Privacy, Cookies + the /legal
// index). The prose styles on the body wrapper cover every element the policy
// copy uses (h2/h3 headings, lists, links, emphasis) so each page can stay
// plain JSX.
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-indigo-500/30">
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl text-white group-hover:scale-105 transition-transform shadow-lg shadow-indigo-600/20">V</div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Vouched.to</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-white transition-colors mr-2">Home</Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-32 pb-24 px-6">
        <article className="max-w-3xl mx-auto">
          <p className="text-indigo-500 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Legal</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{title}</h1>
          <p className="text-sm font-medium text-zinc-500 mb-12">Last updated {updated}</p>
          <div className="space-y-6 text-zinc-600 dark:text-zinc-400 leading-relaxed [&_h2]:text-zinc-900 dark:[&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-zinc-900 dark:[&_h3]:text-white [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:marker:text-zinc-400 dark:[&_li]:marker:text-zinc-600 [&_a]:text-indigo-500 dark:[&_a]:text-indigo-400 [&_a]:font-medium [&_a:hover]:underline [&_strong]:text-zinc-900 dark:[&_strong]:text-white [&_strong]:font-semibold">
            {children}
          </div>
        </article>
      </main>

      <footer className="border-t border-zinc-200 dark:border-white/5 py-10 px-6 text-center">
        <p className="text-xs font-medium text-zinc-500">
          <Link href="/legal" className="hover:text-indigo-400 transition-colors">Legal</Link>
          <span className="mx-3 text-zinc-300 dark:text-zinc-700">·</span>
          <Link href="/legal/privacy" className="hover:text-indigo-400 transition-colors">Privacy</Link>
          <span className="mx-3 text-zinc-300 dark:text-zinc-700">·</span>
          <Link href="/legal/terms" className="hover:text-indigo-400 transition-colors">Terms</Link>
          <span className="mx-3 text-zinc-300 dark:text-zinc-700">·</span>
          <Link href="/legal/cookies" className="hover:text-indigo-400 transition-colors">Cookies</Link>
        </p>
        <p className="mt-4 text-xs font-medium text-zinc-500">© 2026 Vouched.to</p>
      </footer>
    </div>
  );
}
