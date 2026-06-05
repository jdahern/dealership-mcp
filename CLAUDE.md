# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install      # install deps (README uses pnpm; a bun.lock is also committed)
pnpm dev          # start Next.js dev server on :3000
pnpm build        # production build
pnpm start        # serve production build
pnpm lint         # eslint (flat config in eslint.config.mjs)
```

There is no test suite.

### Local development requires a public HTTPS tunnel

MCP Apps run inside a remote host's iframe, so the app must be reachable at a public URL. Run a tunnel (e.g. `ngrok http 3000`), put its HTTPS URL in `.env` as `BASE_URL=...`, then `pnpm dev`. Connect the host (ChatGPT / Cursor / Claude.ai) to `<tunnel-url>/mcp`. Without `BASE_URL` set, assets and RSC fetches inside the iframe will resolve to the wrong origin.

## Architecture

This is an **MCP App**: a single Next.js app that is simultaneously an MCP server *and* the widget UI that an MCP host renders alongside tool calls. The two halves talk through a postMessage bridge inside a sandboxed cross-origin iframe, which drives every non-obvious decision in the codebase.

### The self-fetch loop (`app/mcp/route.ts`)

The MCP server (`mcp-handler` + `@modelcontextprotocol/ext-apps/server`) registers tools and one HTML resource. The resource handler does **not** template HTML — it `fetch`es the app's own rendered page (`fetchPageHtml("/")` against `baseURL`) and returns that HTML as the MCP resource. So the widget the host renders *is* the Next.js page, served back to the host as an `RESOURCE_MIME_TYPE` resource.

- Tools are registered with `registerAppTool` and link to the widget via `_meta.ui.resourceUri`.
- `RESOURCE_URI` is versioned with `UI_VERSION`; bump it when the widget HTML changes so hosts invalidate their cache.
- The resource's `_meta.ui.csp` whitelists `baseURL` for the iframe's connect/resource domains.
- `GET` and `POST` are both the same handler.

### `baseURL` is the linchpin (`baseUrl.ts`)

Every part of the iframe story depends on resolving the app's real public origin: `BASE_URL` env → localhost (dev) → Vercel env vars (prod). It is consumed by `next.config.ts` (`assetPrefix`, so `/_next/*` assets load from the real server), the MCP route (self-fetch + CSP), and the layout bootstrap.

### Iframe bootstrap patches (`app/layout.tsx`)

`IframeBootstrap` injects inline scripts into `<head>` that run **before React hydrates** and make a Next.js page survive inside a foreign-origin sandbox. `iframePatchFn` is serialized via `.toString()` and re-executed in the iframe — its TS types are cosmetic and stripped. It does four things:
1. A `MutationObserver` strips host-injected `<html>` attributes (except `lang`/`suppresshydrationwarning`) to prevent hydration errors.
2. Patches `history.pushState`/`replaceState` to swallow cross-origin `SecurityError`s.
3. Intercepts external-link clicks and routes them to `window.openai.openExternal()`.
4. Patches `window.fetch` so RSC/data requests are rewritten to `baseURL` (the real server) instead of the iframe origin.

Note the `<base href>` tradeoff documented in the file: `assetPrefix` handles asset URLs; a `<base>` tag is present but adding one can break things like Worker URLs (CesiumJS).

### Host bridge hook (`app/hooks/use-mcp-app.ts`)

`useMcpApp()` exposes `{ app, connected, toolInput, toolResult }`. Key design points:
- The `App` instance is a **module-level singleton**, created once and only when running inside an iframe (`window.self !== window.top`). Don't instantiate `App` elsewhere.
- Tool data is mirrored to `sessionStorage` so it survives client-side navigation, HMR re-evaluation, and back/forward history.
- State is exposed via `useSyncExternalStore` over an in-memory cache + listener set (avoids JSON.parse per render).
- `ontoolinput`/`ontoolresult` callbacks update the cache and `notify()` subscribers.

### CORS (`middleware.ts`)

Matches all paths and sets permissive `Access-Control-Allow-*` headers (and handles `OPTIONS` preflight) so the cross-origin iframe can fetch app routes.

## Adding a tool or widget page

- New tool: add another `registerAppTool(...)` in `app/mcp/route.ts`. Return `structuredContent` — that object is what arrives in the widget as `toolResult`.
- New widget page: add a route under `app/` and read host data with `useMcpApp()`. `app/about` and `app/counter` are navigation/interactivity examples.
- Path alias `@/*` maps to the repo root (e.g. `@/baseUrl`).
