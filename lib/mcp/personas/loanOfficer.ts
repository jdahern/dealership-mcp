import type { PersonaConfig } from "../register";
import { WIDGETS } from "../widgets";
import { listCreditApps } from "../tools/credit";
import {
  listLenders,
  submitToLender,
  recordLenderDecision,
  setFinancingTerms,
} from "../tools/lender";
import { viewDeal } from "../tools/deals";

export const loanOfficerPersona: PersonaConfig = {
  name: "Dealership · Loan Officer",
  path: "/mcp/loan-officer",
  widgets: [WIDGETS.credit, WIDGETS.deal],
  tools: [
    listCreditApps,
    listLenders,
    submitToLender,
    recordLenderDecision,
    setFinancingTerms,
    viewDeal,
  ],
};
