import { z } from "zod";
import { and, eq, ilike, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { vehicles } from "@/db/schema";
import type { AppToolDef } from "../register";
import { WIDGETS } from "../widgets";
import { inventoryOutput } from "../schemas";
import { money, text } from "./helpers";

function shapeVehicle(v: typeof vehicles.$inferSelect) {
  return {
    id: v.id,
    stockNumber: v.stockNumber,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim,
    color: v.color,
    mileage: v.mileage,
    sellingPrice: money(v.sellingPrice),
    msrp: money(v.msrp),
    certified: v.certified,
    imageUrl: v.imageUrl,
  };
}

export const browseInventory: AppToolDef = {
  name: "browse_inventory",
  title: "Browse Inventory",
  description:
    "Show available vehicles on the lot, optionally filtered by max price, make, or a free-text query (make/model/trim).",
  inputSchema: {
    maxPrice: z.number().optional().describe("Maximum selling price in dollars"),
    make: z.string().optional().describe("Filter by make, e.g. Toyota"),
    query: z.string().optional().describe("Free-text match on make/model/trim"),
  },
  widget: WIDGETS.inventory,
  outputSchema: inventoryOutput,
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ maxPrice, make, query }) => {
    const conds = [eq(vehicles.status, "available")];
    if (typeof maxPrice === "number")
      conds.push(lte(vehicles.sellingPrice, String(maxPrice)));
    if (typeof make === "string" && make)
      conds.push(ilike(vehicles.make, `%${make}%`));
    if (typeof query === "string" && query) {
      const q = `%${query}%`;
      conds.push(
        or(
          ilike(vehicles.make, q),
          ilike(vehicles.model, q),
          ilike(vehicles.trim, q),
        )!,
      );
    }

    const rows = await db
      .select()
      .from(vehicles)
      .where(and(...conds))
      .limit(50);

    const list = rows.map(shapeVehicle);
    const summary = list
      .slice(0, 8)
      .map(
        (v) =>
          `#${v.id} ${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""} · ${v.color ?? ""} · ${v.mileage.toLocaleString()} mi · $${v.sellingPrice.toLocaleString()}${v.certified ? " (CPO)" : ""}`,
      )
      .join("\n");

    return {
      content: text(
        `${list.length} vehicle(s) available${maxPrice ? ` under $${maxPrice.toLocaleString()}` : ""}:\n${summary}`,
      ),
      structuredContent: { kind: "inventory", count: list.length, vehicles: list },
    };
  },
};
