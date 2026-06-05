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
  icon: "/icons/loan-officer.svg",
  widgets: [WIDGETS.credit, WIDGETS.deal],
  tools: [
    listCreditApps,
    listLenders,
    submitToLender,
    recordLenderDecision,
    setFinancingTerms,
    viewDeal,
  ],
  prompts: [
    {
      name: "work_credit_queue",
      title: "Work my credit queue",
      description: "Review queued credit apps and submit to lenders",
      text: "Show me the credit applications waiting in the queue, then help me submit them to appropriate lenders and record the decisions.",
    },
  ],
};
