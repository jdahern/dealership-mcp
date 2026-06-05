import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import type { ZodRawShape } from "zod";
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

export interface AppToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema?: ZodRawShape;
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
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
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
}

// ---------------------------------------------------------------------------
// buildHandler: wires a persona's widgets (resources) + tools into one handler.
// ---------------------------------------------------------------------------
export function buildHandler({ name, path, widgets, tools }: PersonaConfig) {
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
          annotations: t.annotations,
          _meta: {
            ui: {
              ...(t.widget ? { resourceUri: t.widget.uri } : {}),
              ...(t.visibility ? { visibility: t.visibility } : {}),
            },
          },
        },
        // mcp-handler/ext-apps tool callback — args validated against inputSchema
        async (args: Record<string, unknown>) => {
          const result = await t.handler(args ?? {});
          return result as never;
        },
      );
    }
    },
    { serverInfo: { name, version: "0.1.0" } },
    { streamableHttpEndpoint: path, disableSse: true },
  );
}
