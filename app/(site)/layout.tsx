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
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-400">read-only data viewer</span>
            <a
              href="https://github.com/jdahern/dealership-mcp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <Analytics />
    </div>
  );
}
