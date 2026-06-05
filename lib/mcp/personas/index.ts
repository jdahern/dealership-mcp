import type { PersonaConfig } from "../register";
import { buyerPersona } from "./buyer";
import { salespersonPersona } from "./salesperson";
import { loanOfficerPersona } from "./loanOfficer";
import { managerPersona } from "./manager";

export interface PersonaInfo {
  config: PersonaConfig;
  emoji: string;
  audience: string;
  /** Fixed demo identity, if the persona acts as one specific person. */
  actsAs?: string;
  blurb: string;
}

// Single source of truth for the Help/Connect page. Endpoint paths and tool
// lists come straight from the registered PersonaConfig, so this never drifts
// from what the server actually exposes.
export const PERSONAS: PersonaInfo[] = [
  {
    config: buyerPersona,
    emoji: "🧑",
    audience: "Customer",
    actsAs: "Maria Lopez",
    blurb:
      "Shop from the buyer's seat: browse inventory, get payment quotes, apply for financing, and track loan status.",
  },
  {
    config: salespersonPersona,
    emoji: "🤝",
    audience: "Sales",
    actsAs: "Jordan Reyes",
    blurb:
      "Work a deal: create customers, build desking quotes, add trade-ins and F&I products, and review your deals.",
  },
  {
    config: loanOfficerPersona,
    emoji: "🏦",
    audience: "Finance (F&I)",
    blurb:
      "Run financing: list lenders, submit credit apps, and record lender decisions that advance deals through approval.",
  },
  {
    config: managerPersona,
    emoji: "📊",
    audience: "Management",
    blurb:
      "Oversee the store: view every deal, analyze profitability with reserve insights, approve deals, and reassign salespeople.",
  },
];
