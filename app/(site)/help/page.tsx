import Link from "next/link";
import { baseURL } from "@/baseUrl";
import { PERSONAS } from "@/lib/mcp/personas";
import { CopyButton } from "../copy-button";

export const dynamic = "force-dynamic";

export default function HelpPage() {
  const isLocal = baseURL.includes("localhost") || baseURL.includes("127.0.0.1");

  return (
    <div className="space-y-10">
      {/* Account warning -------------------------------------------------- */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <span className="text-lg leading-none">⚠️</span>
        <div className="space-y-2">
          <p className="font-semibold">Before you connect — two things to avoid confusion:</p>
          <ul className="ml-4 list-disc space-y-1 leading-relaxed">
            <li>
              <strong>Use a personal Claude.ai account, not your company one.</strong> Custom
              MCP connectors aren&apos;t available on most company / Team / Enterprise plans
              (they&apos;re disabled by the workspace admin). Tip: your company Claude login
              usually comes with a <strong>free personal-tier account</strong> you can use for
              this.
            </li>
            <li>
              <strong>Enable only one persona connector at a time.</strong> The personas share
              overlapping tools (e.g. <code>browse_inventory</code>, <code>view_deal</code>),
              so connecting several at once gives Claude duplicate tools and it gets confused
              about which to call. Switch the active connector when you want to play a
              different role.
            </li>
          </ul>
        </div>
      </div>

      {/* About ------------------------------------------------------------ */}
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Connect &amp; Help</h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          This is a <strong>demo car-dealership MCP server</strong> modeled on a real
          sales &amp; F&amp;I platform. It exposes four role-based MCP endpoints that an
          MCP host (Claude.ai, ChatGPT, Cursor) can connect to and render interactive
          widgets for. All data is sample data in a Postgres database, and this website
          is a <strong>read-only viewer</strong> of that same data — so as you drive the
          tools, the deals and inventory here update live.
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          A single deal flows across personas through the lifecycle{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            quoted → deal → credit_submitted → lender_decision → ready
          </code>
          , all backed by one shared database.
        </p>
      </section>

      {/* Server URL ------------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Server URL</h2>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <code className="flex-1 break-all text-sm">{baseURL}</code>
          <CopyButton value={baseURL} label="base URL" />
        </div>
        {isLocal ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            ⚠️ This is a <strong>localhost</strong> URL — an MCP host can&apos;t reach it.
            Start a tunnel (e.g. <code>ngrok http 3000</code>), set its HTTPS URL as{" "}
            <code>BASE_URL</code> in <code>.env</code>, and restart. The endpoints below
            will then use the public URL.
          </p>
        ) : (
          <p className="text-xs text-zinc-400">
            Resolved from the <code>BASE_URL</code> environment variable.
          </p>
        )}
      </section>

      {/* Personas / endpoints -------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Personas &amp; endpoints</h2>
        <p className="text-sm text-zinc-500">
          Each persona is its own MCP endpoint exposing only that role&apos;s tools.
          Connect a host to one (or several) of these URLs.
        </p>

        <div className="space-y-4">
          {PERSONAS.map(({ config, emoji, audience, actsAs, blurb }) => {
            const url = `${baseURL}${config.path}`;
            return (
              <div
                key={config.path}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xl">{emoji}</span>
                  <h3 className="font-semibold">{config.name.replace(/^.*·\s*/, "")}</h3>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {audience}
                  </span>
                  {actsAs && (
                    <span className="text-xs text-zinc-400">acts as {actsAs}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{blurb}</p>

                <div className="mt-3 flex items-center gap-2 rounded-md bg-zinc-50 p-2 dark:bg-zinc-800/50">
                  <code className="flex-1 break-all text-sm">{url}</code>
                  <CopyButton value={url} label={`${audience} endpoint`} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {config.tools.map((t) => (
                    <span
                      key={t.name}
                      title={t.description}
                      className="rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>

                {config.prompts && config.prompts.length > 0 && (
                  <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      Starter prompts
                    </p>
                    <ul className="space-y-0.5">
                      {config.prompts.map((p) => (
                        <li key={p.name} className="text-xs text-zinc-600 dark:text-zinc-300">
                          <span className="font-medium">{p.title}</span>
                          <span className="text-zinc-400"> — {p.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* How to connect --------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">How to connect</h2>
        <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li>
            <strong>1.</strong> Copy the endpoint URL for the persona you want (above).
          </li>
          <li>
            <strong>2.</strong> In your MCP host, add it as a connector / app:
            <ul className="mt-1 ml-5 list-disc space-y-0.5 text-zinc-500">
              <li>
                <strong>Claude.ai</strong> — Settings → Connectors → Add custom connector →
                paste the URL.
              </li>
              <li>
                <strong>ChatGPT</strong> — Settings → Apps &amp; Connectors → add the URL.
              </li>
              <li>
                <strong>Cursor</strong> — Settings → MCP → add the URL as an HTTP server.
              </li>
            </ul>
          </li>
          <li>
            <strong>3.</strong> Start chatting — e.g. ask the Salesperson endpoint{" "}
            <em>&quot;show me inventory under $35k&quot;</em> and the inventory widget renders
            inline.
          </li>
          <li>
            <strong>4.</strong> Watch this site&apos;s{" "}
            <Link href="/deals" className="text-blue-600 hover:underline">
              Deals
            </Link>{" "}
            page reflect changes as you drive the tools.
          </li>
        </ol>
        <p className="text-xs text-zinc-400">
          Tip: to hand a single deal from sales → buyer → finance → manager, switch the
          active connector between roles — keep just one enabled at a time (see the note up
          top).
        </p>
      </section>
    </div>
  );
}
