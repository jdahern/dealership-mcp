import type { PersonaConfig } from "../register";
import { WIDGETS } from "../widgets";
import { browseInventory } from "../tools/inventory";
import { createCustomer } from "../tools/customers";
import { buildQuoteTool } from "../tools/desking";
import { listProducts } from "../tools/products";
import {
  createDeal,
  addTradeIn,
  addProducts,
  viewDeal,
  listMyDeals,
} from "../tools/deals";

export const salespersonPersona: PersonaConfig = {
  name: "Dealership · Salesperson",
  path: "/mcp/salesperson",
  widgets: [WIDGETS.inventory, WIDGETS.products, WIDGETS.desking, WIDGETS.deal],
  tools: [
    createCustomer,
    browseInventory,
    buildQuoteTool,
    createDeal,
    addTradeIn,
    listProducts,
    addProducts,
    viewDeal,
    listMyDeals,
  ],
};
