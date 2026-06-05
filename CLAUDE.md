# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install      # install deps
pnpm dev          # Next.js dev server on :3000
pnpm build        # production build (Turbopack)
pnpm start        # serve production build
pnpm lint         # eslint (flat config in eslint.config.mjs)

pnpm db:push      # push the Drizzle schema to Neon (drizzle-kit push, no migration files)
pnpm db:seed      # wipe + reseed demo data (tsx db/seed.ts) — resets to the pristine storyline
pnpm db:studio    # drizzle-kit studio
```

There is no test suite. To verify behavior, drive the MCP endpoints over the wire (a stateless `POST` with an `Accept: application/json, text/event-stream` header returns an SSE-framed JSON-RPC response) and/or watch the read-only website reflect changes.

### Local development needs a public HTTPS tunnel + a Neon database
- MCP App widgets render inside the host's cross-origin iframe, so the app must be reachable at a public URL. Run a tunnel (`ngrok http 3000`), put its HTTPS URL in `.env` as `BASE_URL=...`, then `pnpm dev`. Without `BASE_URL`, assets/RSC fetches inside the iframe resolve to the wrong origin.
- Set `DATABASE_URL` to a Neon **pooled** connection string. See `.env.example`.
- Connect a host (Claude.ai / ChatGPT / Cursor) to `<tunnel>/mcp/<persona>`. The `/help` page renders the live URLs.

## What this is

A **demo car-dealership MCP server** modeled on a real sales + F&I platform — built on the "MCP Apps" pattern: a single Next.js app that is simultaneously **four MCP servers** (one per persona) *and* the interactive widget UIs the host renders alongside tool calls. A **read-only website** views the same database, so deals/inventory update live as you drive the tools. All data is fake/seeded; there are no real integrations (lender decisions etc. are entered manually as tool inputs).

A deal moves through the lifecycle `quoted → deal → credit_submitted → lender_decision → ready`, handed across personas, all backed by one Neon Postgres DB.

## Architecture

### Four persona endpoints + one shared handler (`lib/mcp/register.ts`)
Each persona is its own route — `app/mcp/{buyer,salesperson,loan-officer,manager}/route.ts` — and is ~3 lines: `buildHandler(<persona>Persona)` exported as both `GET` and `POST`. `buildHandler` (in `lib/mcp/register.ts`) wraps `createMcpHandler` (mcp-handler) and registers that persona's widgets (resources), tools, and prompts.

A persona is declared in `lib/mcp/personas/*.ts` as a `PersonaConfig`: `{ name, path, icon, widgets[], tools[], prompts[] }`. `lib/mcp/personas/index.ts` exports `PERSONAS` (config + display metadata) — the single source the `/help` and `/examples` pages read, so docs never drift from the registered endpoints.

**mcp-handler routing gotcha:** mcp-handler derives its endpoint by appending `/mcp` to `basePath`, which would never match `/mcp/<persona>`. So `buildHandler` sets the exact `streamableHttpEndpoint: path` (and `disableSse: true`) per persona. This is why the connect URLs are `/mcp/<persona>` and not `/<persona>/mcp`.

### Self-fetch widgets (`lib/mcp/widgets.ts`, `app/widgets/*`)
Widgets are **not** templated HTML. Each `AppWidget` maps a `ui://dealership/<key>.html?v=<WIDGET_VERSION>` resource URI to a Next.js page path; the resource handler `fetch`es that rendered page (`fetchPageHtml`) and returns the HTML as a `RESOURCE_MIME_TYPE` resource. The page the host renders *is* the Next.js page. Widget pages live under `app/widgets/{inventory,products,desking,deal,credit,dashboard}/page.tsx`.
- **Bump `WIDGET_VERSION` in `lib/mcp/widgets.ts` whenever any widget's HTML changes** so hosts invalidate their cached resource.
- The resource's `_meta.ui.csp` whitelists `connectDomains: [baseURL]` and `resourceDomains: RESOURCE_DOMAINS` (baseURL + Unsplash, for vehicle photos). Without the image domains in CSP, the host blocks the `<img>`s.
- A tool links to its widget via `_meta.ui.resourceUri` (set from `AppToolDef.widget`). Headless tools (e.g. `create_customer`, `list_lenders`) omit `widget`.

### `baseURL` is the linchpin (`baseUrl.ts`)
Resolves the real public origin: `BASE_URL` env → localhost (dev) → Vercel env vars (prod). Consumed by `next.config.ts` (`assetPrefix`, so `/_next/*` load from the real server), the MCP resource self-fetch + CSP, the iframe bootstrap, and the icon URLs. On Vercel it auto-resolves — no tunnel needed.

### Iframe bootstrap (`app/layout.tsx`)
`IframeBootstrap` injects inline scripts (run before hydration) that make a Next.js page survive a foreign-origin sandbox: strips host-injected `<html>` attrs, patches `history`/`fetch` for cross-origin, routes external links. `iframePatchFn` is serialized via `.toString()` — its TS types are cosmetic.

### Host bridge + widget kit (`app/hooks/use-mcp-app.ts`, `app/widgets/widget-kit.tsx`)
`useMcpApp()` exposes `{ app, connected, toolInput, toolResult }` over a module-level singleton `App` (created only inside an iframe), mirrored to `sessionStorage`. `widget-kit.tsx` adds the shared widget primitives:
- `useWidgetData<T>(kind)` — reads `toolResult` and **shape-guards by `kind`** (the singleton keeps the last tool result across widget pages in one iframe, so each widget must ignore payloads that aren't its shape).
- `SendMessageButton` / `useCanMessage` — inject a chat turn via `app.sendMessage` (capability-gated on `getHostCapabilities()?.message`).
- `usd`, `WidgetShell`, `Waiting`, `StatusBadge`.

Widgets also call `app.callServerTool({ name, arguments })` directly for silent server-side recompute (e.g. desking "Save to deal").

### Data layer (`db/`)
Drizzle ORM over `@neondatabase/serverless` **neon-http** (one-shot HTTP queries — right for serverless route handlers; no module-scope pool; no multi-statement transactions, which is fine since writes are single-row). `db/schema.ts` has all entities (customers, salespeople, vehicles, lenders, products, deals, tradeIns, dealProducts, paymentCalculations, creditApps, lenderSubmissions, loanDecisions) + enums. `db/seed.ts` plants the storyline (Maria Lopez / RAV4 / Prime Bank) with 5 deals spanning every lifecycle stage. Serial IDs climb across reseeds — never hardcode IDs in tests; resolve by name/email.

### Tools (`lib/mcp/tools/*`)
Each tool is an `AppToolDef`: `{ name, title, description, inputSchema (zod raw shape), outputSchema, widget?, visibility?, annotations?, handler }`. The `handler(args, extra?)` returns `{ content: [{type:"text", text}], structuredContent?, isError? }` — `content` is what the model reads (always provide it), `structuredContent` is what the widget renders.
- **`outputSchema`** (Zod raw shapes in `lib/mcp/schemas.ts`) is validated by the SDK and advertised in `tools/list`. Validation is **skipped when `isError: true`**, and a non-error result with an `outputSchema` **must** include `structuredContent` (else the SDK throws). So "nothing to show" branches (`view_my_deal`/`check_loan_status` with no record) return `isError: true`. Parsing is non-strict (extra keys ignored), so scope-varying fields (`frontGross`/`cost`/`reserve`) are `.optional()`.
- **Scope-based views:** `buildDealView(dealId, scope)` and `buildCreditStatus(appId, scope)` hide cost/gross from the `buyer` scope. Personas pass their scope.
- **Fixed identities (no auth):** salesperson acts as `getActingSalesperson()` (Jordan Reyes), buyer as `getActingBuyer()` (Maria Lopez). So `list_my_deals`/`view_my_deal`/`submit_credit_app` operate on that fixed person.
- **Lookup-not-guess:** `list_products`/`list_lenders` expose catalogs, and `add_products`/`submit_to_lender`/`record_lender_decision` accept **names or IDs** (resolved via `ilike`).

### MCP capabilities demonstrated (and deliberately not)
Built: tools (+ `structuredContent`, `outputSchema`, annotations, `visibility`), MCP-Apps widgets, `callServerTool`, `sendMessage` (widget→chat CTAs), per-persona **prompts** with **argument completions** (`completable()` over Neon data, in `lib/mcp/prompts.ts`), **progress notifications** (`submit_to_lender` streams `notifications/progress` via `extra.sendNotification` — `loan-officer/route.ts` sets `maxDuration = 60`), per-connector **icons** (`public/icons/*`).
Not done, by design: **Tasks** (experimental in SDK 1.25.2, no Claude.ai host negotiation); **resource subscriptions** / live `tools/list_changed` (need a persistent server→client channel — impossible on the stateless, SSE-disabled, POST-only serverless transport). `updateModelContext`, elicitation, and sampling are supported but unused (host support unverified).

### Read-only website (`app/(site)/*`)
Route group with its own layout/nav. Server components query Neon directly with `export const dynamic = "force-dynamic"` so refreshes reflect MCP mutations. Pages: overview (`page.tsx`), `inventory`, `deals`, `deals/[id]`, `examples` (worked sample chats, data in `lib/examples.ts`), `help` (Connect page — live server/endpoint URLs from `baseURL` + `PERSONAS`, copy buttons, one-click connector deep links). `middleware.ts` applies permissive CORS to all paths so the cross-origin iframe can fetch app routes. There is **no auth** (Neon Auth was built then removed).

## Adding things
- **New tool:** add an `AppToolDef` in `lib/mcp/tools/*`, define its `outputSchema` in `lib/mcp/schemas.ts`, return `content` + `structuredContent`, then add it to the relevant persona's `tools[]`.
- **New widget:** add a `WIDGETS` entry + a page under `app/widgets/<key>/page.tsx` (`"use client"`, use `useWidgetData`), point the tool's `widget` at it, bump `WIDGET_VERSION`.
- **New prompt:** add to a persona's `prompts[]`; for autocomplete give an arg a `complete` callback (see `lib/mcp/prompts.ts`).
- **New persona:** add `lib/mcp/personas/<name>.ts`, a route at `app/mcp/<name>/route.ts`, an icon in `public/icons/`, and an entry in `PERSONAS`.

## Conventions / gotchas
- Path alias `@/*` maps to the repo root.
- Lint will fail on: unescaped `'`/`"` in JSX (`react/no-unescaped-entities` → use `&apos;`/`&quot;`), `<a href="/…">` for internal links (`@next/next/no-html-link-for-pages` → use `next/link`), and `<img>` without an `{/* eslint-disable-next-line @next/next/no-img-element */}`.
- After mutating tests, run `pnpm db:seed` to restore the demo storyline.
- On Vercel, set the same env vars (`DATABASE_URL`, `BASE_URL` auto-resolves) in the dashboard.
- `tsc --noEmit` may report stale errors under `.next/*/types` after deleting routes — they clear on the next build.
