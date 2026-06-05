import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import type { ZodRawShape } from "zod";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import type { Implementation } from "@modelcontextprotocol/sdk/types.js";
import type { AppWidget } from "./widgets";

// ---------------------------------------------------------------------------
// Self-fetch: render a Next.js widget page and return its HTML as the resource.
// (Same mechanism as the original starter's app/mcp/route.ts.)
// ---------------------------------------------------------------------------
async function fetchPageHtml(path: string): Promise<string> {
  const res = await fetch(`${baseURL}${path}`);
  return res.text();
}

// External origins the widget iframe is allowed to load static resources
// (images, etc.) from. baseURL serves the Next.js assets; vehicle photos come
// from Unsplash. Without these in the CSP `resourceDomains` (→ img-src), the
// host blocks the images and they render broken.
const RESOURCE_DOMAINS = [baseURL, "https://images.unsplash.com", "https://*.unsplash.com"];

// Build the MCP serverInfo (Implementation) including a per-persona icon so each
// connector shows a distinct icon in the host's connector list. `src` must be an
// absolute, host-reachable URL (served from /public at baseURL).
function makeServerInfo(name: string, icon?: string): Implementation {
  return {
    name,
    version: "0.1.0",
    ...(icon
      ? { icons: [{ src: `${baseURL}${icon}`, mimeType: "image/svg+xml", sizes: ["any"] }] }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Tool definition shape used by persona modules.
// ---------------------------------------------------------------------------
export interface ToolResult {
  /** Text the model reads (always provide — non-UI host fallback). */
  content: { type: "text"; text: string }[];
  /** Data the widget renders via useMcpApp().toolResult. */
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

/**
 * Subset of the SDK's per-request `extra` that tools may use. Notably the
 * progress channel: when the client includes a `progressToken`, a tool can
 * stream `notifications/progress` back over the open request.
 */
export interface ToolExtra {
  _meta?: { progressToken?: string | number };
  sendNotification?: (notification: {
    method: string;
    params?: Record<string, unknown>;
  }) => Promise<void> | void;
}

export interface AppToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema?: ZodRawShape;
  /** Zod raw shape describing `structuredContent`; validated + advertised in tools/list. */
  outputSchema?: ZodRawShape;
  /** Which widget this tool renders in (its resource URI). Omit for headless tools. */
  widget?: AppWidget;
  /** ["model","app"] default; use ["app"] for widget-only helper tools. */
  visibility?: ("model" | "app")[];
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  handler: (args: Record<string, unknown>, extra?: ToolExtra) => Promise<ToolResult>;
}

/** An argument a prompt accepts, optionally with autocomplete suggestions. */
export interface AppPromptArg {
  name: string;
  description?: string;
  /** Defaults to required; set false to make the arg optional. */
  required?: boolean;
  /**
   * Autocomplete callback (powers `completion/complete`). Receives the partial
   * value the user has typed plus any sibling args already filled in.
   */
  complete?: (
    value: string,
    args: Record<string, string>,
  ) => Promise<string[]> | string[];
}

/** A server-defined prompt (conversation starter) the host can surface. */
export interface AppPrompt {
  name: string;
  title: string;
  description: string;
  /** Optional arguments; args with a `complete` fn get autocompletion. */
  args?: AppPromptArg[];
  /** The user-message text — a static string, or a builder when there are args. */
  text: string | ((args: Record<string, string>) => string);
}

export interface PersonaConfig {
  /** Display name (server info) for this persona, e.g. "Dealership · Salesperson". */
  name: string;
  /**
   * Exact route path this handler is mounted at, e.g. "/mcp/salesperson".
   * mcp-handler matches the request pathname against this for the streamable
   * HTTP transport. (Its basePath derivation only ever appends "/mcp", so we
   * set the endpoint explicitly to keep nice /mcp/<persona> URLs.)
   */
  path: string;
  /** Distinct widgets used by this persona (deduped before registration). */
  widgets: AppWidget[];
  tools: AppToolDef[];
  /** Optional conversation-starter prompts for this persona. */
  prompts?: AppPrompt[];
  /** Path (under /public) to this persona's connector icon, e.g. "/icons/buyer.svg". */
  icon?: string;
}

// ---------------------------------------------------------------------------
// buildHandler: wires a persona's widgets (resources) + tools into one handler.
// ---------------------------------------------------------------------------
export function buildHandler({ name, path, widgets, tools, prompts, icon }: PersonaConfig) {
  // dedupe widgets by uri
  const uniqueWidgets = Array.from(
    new Map(widgets.map((w) => [w.uri, w])).values(),
  );

  return createMcpHandler(
    async (server) => {
    for (const w of uniqueWidgets) {
      registerAppResource(
        server,
        w.name,
        w.uri,
        { mimeType: RESOURCE_MIME_TYPE },
        async () => {
          const html = await fetchPageHtml(w.pagePath);
          return {
            contents: [
              {
                uri: w.uri,
                mimeType: RESOURCE_MIME_TYPE,
                text: html,
                _meta: {
                  ui: {
                    csp: {
                      connectDomains: [baseURL],
                      resourceDomains: RESOURCE_DOMAINS,
                    },
                  },
                },
              },
            ],
          };
        },
      );
    }

    for (const t of tools) {
      registerAppTool(
        server,
        t.name,
        {
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema ?? {},
          ...(t.outputSchema ? { outputSchema: t.outputSchema } : {}),
          annotations: t.annotations,
          _meta: {
            ui: {
              ...(t.widget ? { resourceUri: t.widget.uri } : {}),
              ...(t.visibility ? { visibility: t.visibility } : {}),
            },
          },
        },
        // mcp-handler/ext-apps tool callback — args validated against inputSchema.
        // `extra` carries the progress channel (sendNotification + progressToken);
        // typed `unknown` here so the callback stays assignable to the SDK shape.
        async (args: Record<string, unknown>, extra: unknown) => {
          const result = await t.handler(args ?? {}, extra as ToolExtra);
          return result as never;
        },
      );
    }

    for (const p of prompts ?? []) {
      const buildMessages = (a: Record<string, string>) => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: typeof p.text === "function" ? p.text(a ?? {}) : p.text,
            },
          },
        ],
      });

      if (p.args && p.args.length) {
        // Build a Zod arg shape; wrap completable args so the McpServer
        // auto-registers a `completion/complete` handler for them.
        const argsSchema: Record<string, z.ZodTypeAny> = {};
        for (const a of p.args) {
          const base = a.description ? z.string().describe(a.description) : z.string();
          const opt = a.required === false ? base.optional() : base;
          argsSchema[a.name] = a.complete
            ? completable(opt, (value, ctx) =>
                a.complete!(String(value ?? ""), ctx?.arguments ?? {}),
              )
            : opt;
        }
        server.registerPrompt(
          p.name,
          { title: p.title, description: p.description, argsSchema },
          (a) => buildMessages(a as Record<string, string>),
        );
      } else {
        server.registerPrompt(
          p.name,
          { title: p.title, description: p.description },
          () => buildMessages({}),
        );
      }
    }
    },
    { serverInfo: makeServerInfo(name, icon) },
    { streamableHttpEndpoint: path, disableSse: true },
  );
}
