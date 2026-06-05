import type { PersonaConfig } from "../register";
import { WIDGETS } from "../widgets";
import { browseInventory } from "../tools/inventory";
import { buildQuoteTool } from "../tools/desking";
import { viewMyDeal } from "../tools/deals";
import { submitCreditApp, checkLoanStatus } from "../tools/credit";
import { browseByMakePrompt } from "../prompts";

export const buyerPersona: PersonaConfig = {
  name: "Dealership · Buyer",
  path: "/mcp/buyer",
  icon: "/icons/buyer.svg",
  widgets: [WIDGETS.inventory, WIDGETS.desking, WIDGETS.deal, WIDGETS.credit],
  tools: [browseInventory, buildQuoteTool, viewMyDeal, submitCreditApp, checkLoanStatus],
  prompts: [
    {
      name: "find_a_car",
      title: "Find a car & payment",
      description: "Browse inventory and estimate a monthly payment",
      text: "Help me find a vehicle that fits my budget. Show me some inventory and estimate monthly payments, then build me a quote on one I like.",
    },
    browseByMakePrompt,
  ],
};
