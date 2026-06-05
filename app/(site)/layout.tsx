import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

// Read-only data viewer. Kept separate from /mcp/* and /widgets/* (which must
// stay open + CORS-friendly for the MCP host and the widget self-fetch).
// Vercel Analytics is scoped to the website here (not the root layout) so it
// doesn't fire inside the sandboxed MCP widget iframes, where the host CSP
// blocks the beacon anyway and the "pageviews" wouldn't be real users.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
          <Link href="/" className="text-sm font-bold tracking-tight">
            🚗 Demo Dealership
          </Link>
          <nav className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Overview
            </Link>
            <Link href="/inventory" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Inventory
            </Link>
            <Link href="/deals" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Deals
            </Link>
            <Link href="/examples" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Examples
            </Link>
            <Link href="/help" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Connect
            </Link>
          </nav>
          <span className="ml-auto text-xs text-zinc-400">read-only data viewer</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <Analytics />
    </div>
  );
}
