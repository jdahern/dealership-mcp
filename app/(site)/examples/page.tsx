import { PERSONAS } from "@/lib/mcp/personas";
import { EXAMPLES, type ExampleTurn } from "@/lib/examples";

// Static demo conversations — no host data, so no force-dynamic needed.

function Turn({ turn }: { turn: ExampleTurn }) {
  switch (turn.kind) {
    case "user":
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white">
            {turn.text}
          </div>
        </div>
      );
    case "assistant":
      return (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-lg rounded-bl-sm border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {turn.text}
          </div>
        </div>
      );
    case "tool":
      return (
        <div className="space-y-1">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800/60">
            <span aria-hidden>🔧</span>
            <code className="font-mono text-xs text-violet-700 dark:text-violet-300">
              {turn.name}
            </code>
            {turn.args && (
              <code className="font-mono text-xs break-all text-zinc-500 dark:text-zinc-400">
                {turn.args}
              </code>
            )}
          </div>
          {turn.note && (
            <p className="text-xs text-zinc-400 italic">{turn.note}</p>
          )}
        </div>
      );
    case "widget":
      return (
        <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] leading-snug text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          {turn.ascii}
        </pre>
      );
    case "note":
      return (
        <p className="border-l-2 border-zinc-200 pl-3 text-xs text-zinc-400 italic dark:border-zinc-700">
          {turn.text}
        </p>
      );
  }
}

export default function ExamplesPage() {
  const byPath = new Map(PERSONAS.map((p) => [p.config.path, p]));

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Examples</h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Illustrative chats for each of the four MCP persona endpoints, threaded
          into one storyline — a single deal (Maria Lopez buying a 2023 RAV4) moving
          across personas to show how the shared data changes hands. Tool calls are
          shown as{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">🔧 tool_name</code>{" "}
          chips and the boxed blocks are the widgets the host renders inline.
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          A deal moves through the lifecycle{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            quoted → deal → credit_submitted → lender_decision → ready
          </code>
          . Numeric IDs below (deal #1042, app #31, …) are illustrative — real IDs
          are serial and vary.
        </p>
      </section>

      {EXAMPLES.map((example) => {
        const persona = byPath.get(example.path);
        const name = persona?.config.name.replace(/^.*·\s*/, "") ?? example.path;
        return (
          <section key={example.path} className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl">{persona?.emoji}</span>
                <h2 className="text-lg font-semibold">{name}</h2>
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {example.path}
                </code>
                {persona?.actsAs && (
                  <span className="text-xs text-zinc-400">
                    acts as {persona.actsAs}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">{example.intro}</p>
            </div>

            <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              {example.turns.map((turn, i) => (
                <Turn key={i} turn={turn} />
              ))}
            </div>
          </section>
        );
      })}

      <section>
        <h2 className="text-lg font-semibold">What this illustrates</h2>
        <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
          <li>
            Each persona endpoint exposes only its slice of tools and a scoped view
            of the same data — the buyer never sees gross/cost; the manager sees
            everything.
          </li>
          <li>
            Catalog tools (<code>list_products</code>, <code>list_lenders</code>) are
            called first, then the action attaches by name (<code>productNames</code>,{" "}
            <code>lenderNames</code>, <code>lenderName</code>) so nothing has to guess
            serial IDs.
          </li>
          <li>
            The same deal flows across four separate MCP connections, all backed by
            one shared database.
          </li>
          <li>
            Widgets are interactive (term chips recompute via{" "}
            <code>callServerTool</code>), not static.
          </li>
        </ul>
      </section>
    </div>
  );
}
