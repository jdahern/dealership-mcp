import type { PersonaConfig } from "../register";
import { WIDGETS } from "../widgets";
import {
  listAllDeals,
  dealProfitability,
  approveDeal,
  reassignSalesperson,
} from "../tools/manager";
import { viewDeal } from "../tools/deals";

export const managerPersona: PersonaConfig = {
  name: "Dealership · Manager",
  path: "/mcp/manager",
  icon: "/icons/manager.svg",
  widgets: [WIDGETS.dashboard, WIDGETS.deal],
  tools: [listAllDeals, dealProfitability, approveDeal, reassignSalesperson, viewDeal],
  prompts: [
    {
      name: "review_pipeline",
      title: "Review the pipeline",
      description: "Review all open deals and flag what needs attention",
      text: "Give me a rundown of all open deals. Flag any with weak front gross or no F&I products, and tell me what needs my attention.",
    },
  ],
};
