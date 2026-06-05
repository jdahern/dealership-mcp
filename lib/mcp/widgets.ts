// ---------------------------------------------------------------------------
// Widget registry: maps each interactive widget to (a) the MCP resource URI a
// tool references via `_meta.ui.resourceUri`, and (b) the Next.js page path the
// MCP resource handler self-fetches to produce the widget HTML.
//
// Bump WIDGET_VERSION whenever any widget page's HTML changes so hosts
// invalidate their cached resource.
// ---------------------------------------------------------------------------

export const WIDGET_VERSION = "2026-06-04-7";

export interface AppWidget {
  /** Resource registration name (human label). */
  name: string;
  /** ui:// resource URI referenced by tools and registered as the resource. */
  uri: string;
  /** Next.js path self-fetched to render this widget's HTML. */
  pagePath: string;
}

function widget(key: string, pagePath: string, name: string): AppWidget {
  return {
    name,
    pagePath,
    uri: `ui://dealership/${key}.html?v=${WIDGET_VERSION}`,
  };
}

export const WIDGETS = {
  inventory: widget("inventory", "/widgets/inventory", "Inventory Grid"),
  products: widget("products", "/widgets/products", "F&I Product Menu"),
  desking: widget("desking", "/widgets/desking", "Desking Calculator"),
  deal: widget("deal", "/widgets/deal", "Deal Viewer"),
  credit: widget("credit", "/widgets/credit", "Credit Board"),
  dashboard: widget("dashboard", "/widgets/dashboard", "Deal Dashboard"),
} as const;

export type WidgetKey = keyof typeof WIDGETS;
