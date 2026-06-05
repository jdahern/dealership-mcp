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
import { quoteForCustomerPrompt } from "../prompts";

export const salespersonPersona: PersonaConfig = {
  name: "Dealership · Salesperson",
  path: "/mcp/salesperson",
  icon: "/icons/salesperson.svg",
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
  prompts: [
    {
      name: "desk_a_deal",
      title: "Desk a new deal",
      description: "Guided flow to desk a deal from scratch",
      text: "Help me desk a new deal end to end: create the customer, browse inventory to pick a vehicle, build a quote, then add any trade-in and F&I products.",
    },
    quoteForCustomerPrompt,
  ],
};
