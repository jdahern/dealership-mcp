# Dealership MCP — Demo

A demo car-dealership server built as an **[MCP App](https://modelcontextprotocol.io)**: a single [Next.js](https://nextjs.org) app that is simultaneously an **MCP server** *and* the interactive widget UI that an MCP host (Claude.ai, ChatGPT, Cursor) renders alongside tool calls. It's modeled on a real automotive sales + F&I (finance & insurance) platform, with **four role-based personas**, **fake/seeded data** in Postgres, and a **read-only website** that views the same data live.

> All data is sample data and there are no real integrations — lender decisions, credit pulls, etc. are entered as tool inputs. It's a showcase of MCP capabilities in a believable domain, not a production system.

## The four personas

Each persona is its own MCP endpoint exposing only that role's tools and widgets:

| Persona | Endpoint | Does |
|---|---|---|
| 🧑 **Buyer** | `/mcp/buyer` | Browse inventory, get quotes, apply for financing, track loan status |
| 🤝 **Salesperson** | `/mcp/salesperson` | Create customers, desk quotes, build deals with trade-ins + F&I products |
| 🏦 **Loan Officer** | `/mcp/loan-officer` | Work the credit queue, submit to lenders, record decisions |
| 📊 **Manager** | `/mcp/manager` | View all deals, analyze profitability, approve deals, reassign salespeople |

A single deal flows across personas through the lifecycle `quoted → deal → credit_submitted → lender_decision → ready`, all backed by one shared database — so the buyer's application shows up in the loan officer's queue, the decision flows back to the buyer, and the manager's dashboard rolls it all up.

## How it works

- **MCP server** (`app/mcp/<persona>/route.ts`) — each persona registers its tools, interactive UI resources, and prompts via a shared `buildHandler` (`lib/mcp/register.ts`) over [`mcp-handler`](https://github.com/vercel/mcp-handler) + [`@modelcontextprotocol/ext-apps`](https://github.com/modelcontextprotocol/ext-apps).
- **Widgets** (`app/widgets/*`) — React pages the host renders in a sandboxed iframe. The MCP resource handler self-fetches the rendered page HTML and serves it as the widget. Widgets read tool output via the `useMcpApp()` hook and can talk back to the chat (`sendMessage`) or re-run tools silently (`callServerTool`).
- **Database** — Neon Postgres via Drizzle ORM. `db/seed.ts` plants a storyline (Maria Lopez buying a RAV4) with deals at every lifecycle stage.
- **Website** (`app/(site)/*`) — a read-only viewer of the same DB (Overview · Inventory · Deals · Examples · Connect). Open it while you drive the tools to watch state change.

### MCP features demonstrated
Tools with structured output + output schemas, interactive **MCP App widgets**, widget→server `callServerTool`, widget→chat `sendMessage` buttons, per-persona **prompts** with **argument autocompletion**, streamed **progress notifications** (submitting to lenders), and per-connector icons.

## Getting started

### 1. Install

```bash
pnpm install
```

### 2. Database (Neon)

Create a [Neon](https://neon.tech) Postgres database and copy `.env.example` to `.env`, setting the **pooled** connection string:

```
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

Then push the schema and seed demo data:

```bash
pnpm db:push
pnpm db:seed
```

### 3. Public HTTPS tunnel

MCP App widgets render inside the host's iframe, so the app needs a public URL. Start a tunnel and put its HTTPS URL in `.env`:

```bash
ngrok http 3000
```
```
BASE_URL=https://your-tunnel.ngrok-free.app
```

### 4. Run

```bash
pnpm dev
```

Visit `<BASE_URL>` for the read-only website. The **Connect** page (`/help`) shows the live endpoint URLs with copy buttons and one-click "Add to Claude/Cursor" links.

### 5. Connect a host

Add a persona endpoint as a custom connector:

- **Claude.ai** — Settings → Connectors → Add custom connector → paste `<BASE_URL>/mcp/<persona>`
- **ChatGPT** — Settings → Apps & Connectors → add the URL
- **Cursor** — Settings → MCP → add the URL as an HTTP server

Then try, e.g., the salesperson endpoint: *"show me inventory under $35k"* → an inventory grid renders; click **Get a quote** on a car to drive the next step. Connect multiple personas to hand one deal from sales → buyer → finance → manager.

## Deploy

Deploy to [Vercel](https://vercel.com/new). Set `DATABASE_URL` in the project's environment variables — `BASE_URL` is derived automatically from Vercel's env vars in production, so no tunnel is needed. Connect a host to `https://your-app.vercel.app/mcp/<persona>`.

## Project structure

```
app/
  mcp/<persona>/route.ts   — the four MCP endpoints (buyer/salesperson/loan-officer/manager)
  widgets/*/page.tsx        — interactive widget UIs (inventory, desking, deal, credit, dashboard, products)
  (site)/*                  — read-only website (overview, inventory, deals, examples, help/Connect)
  hooks/use-mcp-app.ts      — host bridge hook
  layout.tsx                — iframe bootstrap
lib/mcp/
  register.ts               — buildHandler (registers widgets/tools/prompts per persona)
  personas/*                — PersonaConfig per role + PERSONAS index
  tools/*                   — tool implementations
  widgets.ts                — widget URI registry (bump WIDGET_VERSION on widget HTML changes)
  schemas.ts                — Zod output schemas for tool structuredContent
  prompts.ts                — prompts with autocompleting args
  payment-math.ts           — desking/payment calculations
db/                         — Drizzle schema, client (neon-http), seed
baseUrl.ts                  — public URL resolver (tunnel / Vercel)
middleware.ts               — permissive CORS for the cross-origin iframe
```

See [CLAUDE.md](./CLAUDE.md) for architecture details and conventions, and [docs/sample-chats.md](./docs/sample-chats.md) for worked persona interactions.

## Learn more

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Apps / ext-apps](https://github.com/modelcontextprotocol/ext-apps)
- [mcp-handler](https://github.com/vercel/mcp-handler)
- [Neon](https://neon.tech) · [Drizzle ORM](https://orm.drizzle.team)
