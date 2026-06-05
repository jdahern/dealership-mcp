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
  widgets: [WIDGETS.dashboard, WIDGETS.deal],
  tools: [listAllDeals, dealProfitability, approveDeal, reassignSalesperson, viewDeal],
};
