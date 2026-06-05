import type { PersonaConfig } from "../register";
import { WIDGETS } from "../widgets";
import { browseInventory } from "../tools/inventory";
import { buildQuoteTool } from "../tools/desking";
import { viewMyDeal } from "../tools/deals";
import { submitCreditApp, checkLoanStatus } from "../tools/credit";

export const buyerPersona: PersonaConfig = {
  name: "Dealership · Buyer",
  path: "/mcp/buyer",
  widgets: [WIDGETS.inventory, WIDGETS.desking, WIDGETS.deal, WIDGETS.credit],
  tools: [browseInventory, buildQuoteTool, viewMyDeal, submitCreditApp, checkLoanStatus],
};
