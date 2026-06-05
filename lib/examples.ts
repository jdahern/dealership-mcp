// Typed example conversations rendered on the /examples page.
// Kept in sync with docs/sample-chats.md — the single storyline of Maria Lopez
// buying a 2023 RAV4 as one deal moves across the four persona endpoints.
//
// IDs (deal #1042, app #31, …) are illustrative — real IDs are serial and vary.

/** A single chat turn or rendered artifact in an example conversation. */
export type ExampleTurn =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "tool"; name: string; args?: string; note?: string }
  | { kind: "widget"; ascii: string }
  | { kind: "note"; text: string }
  // An in-widget button that injects a chat message via app.sendMessage.
  // `label` is the button text; `message` is the user turn it injects.
  | { kind: "button"; label: string; message: string; note?: string }
  // A streamed-progress depiction (e.g. submit_to_lender's notifications/progress).
  | { kind: "progress"; steps: { label: string; progress: number; total: number }[]; note?: string };

export interface PersonaExample {
  /** Matches PersonaConfig.path so we can pull emoji + name from PERSONAS. */
  path: string;
  /** Short framing line shown under the heading. */
  intro: string;
  turns: ExampleTurn[];
}

export const EXAMPLES: PersonaExample[] = [
  {
    path: "/mcp/salesperson",
    intro:
      "Acting as Jordan Reyes. Tools: create_customer, browse_inventory, build_quote, create_deal, add_trade_in, list_products, add_products, view_deal, list_my_deals.",
    turns: [
      {
        kind: "user",
        text: "New up Maria Lopez, she's interested in the silver RAV4 we have. Phone 555-0142, email maria.lopez@gmail.com.",
      },
      {
        kind: "tool",
        name: "create_customer",
        args: '{ firstName: "Maria", lastName: "Lopez", phone: "555-0142", email: "maria.lopez@gmail.com" }',
      },
      {
        kind: "assistant",
        text: "Created Maria Lopez (#14). Want me to pull up the RAV4 and start a quote?",
      },
      { kind: "user", text: "Yeah, show me what's on the lot under $35k." },
      { kind: "tool", name: "browse_inventory", args: "{ maxPrice: 35000 }" },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  INVENTORY · 6 vehicles ≤ $35,000              [grid widget]   │
├──────────────────────────────────────────────────────────────┤
│ 🚗 2023 Toyota RAV4 XLE   · Silver · 12,400 mi · $32,995  CPO │
│ 🚗 2022 Honda CR-V EX     · Blue   · 28,100 mi · $29,450      │
│ 🚗 2024 Mazda CX-5        · White  ·  4,200 mi · $33,900      │
│ … (click a row to select)                                     │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "button",
        label: "Get a quote →",
        message:
          "I'd like a quote on the 2023 Toyota RAV4 XLE (vehicle #7).",
        note: "Per-card button — injects this as a chat turn so the flow moves forward without typing.",
      },
      { kind: "user", text: "The RAV4. Build a finance quote, $3k down, 72 months." },
      {
        kind: "tool",
        name: "build_quote",
        args: '{ vehicleId: 7, type: "finance", down: 3000, term: 72 }',
      },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  DESKING · 2023 Toyota RAV4 XLE · $32,995      [calc widget]  │
├──────────────────────────────────────────────────────────────┤
│  Finance  | Cash | Lease            Down: [$3,000]  Term:[72] │
│  ─────────────────────────────────────────────────────────── │
│  Amount financed   $31,240    (incl. tax + $699 doc)          │
│  Est. APR          6.9%                                       │
│  ▶  Monthly        $528 / mo                                  │
│                                                               │
│  [ 48mo $689 ] [ 60mo $586 ] [ 72mo $528 ]  ← click to recalc │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "note",
        text: "Clicking a term chip calls build_quote again via callServerTool — recomputes in-place, no new chat turn.",
      },
      {
        kind: "button",
        label: "Create this deal →",
        message:
          "Create a finance deal on the 2023 Toyota RAV4 (vehicle #7) with $3,000 down over 72 months at 6.9% APR.",
        note: "Shown while the quote isn't saved to a deal yet; once a deal exists it becomes [ Apply for financing → ].",
      },
      {
        kind: "user",
        text: "Good. Create the deal and add her trade — 2016 Civic, 95k miles, she owes about $4,200.",
      },
      {
        kind: "tool",
        name: "create_deal",
        args: '{ customerId: 14, vehicleId: 7, type: "finance", down: 3000, term: 72 }',
      },
      {
        kind: "tool",
        name: "add_trade_in",
        args: '{ dealId: 1042, year: 2016, make: "Honda", model: "Civic", mileage: 95000, acv: 9500, payoff: 4200 }',
      },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  DEAL #1042 · Maria Lopez · status: DEAL        [deal widget] │
├──────────────────────────────────────────────────────────────┤
│  Vehicle    2023 RAV4 XLE              $32,995                │
│  Trade-in   2016 Civic (ACV $9,500 − payoff $4,200) = +$5,300│
│  Products   —                                                 │
│  Type       Finance · 72mo · 6.9%      Payment  $528/mo       │
│  Front gross $2,140                                           │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "user",
        text: "What F&I products can I attach? Add GAP and a service contract.",
      },
      {
        kind: "tool",
        name: "list_products",
        note: "Always call this before add_products so you attach the right product — no guessing IDs.",
      },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  F&I MENU · 5 products                       [products widget]│
├──────────────────────────────────────────────────────────────┤
│  Vehicle Service Contract  [warranty]   $2,495 retail        │
│  GAP Protection            [gap]        $   895 retail       │
│  Prepaid Maintenance       [maintenance]$   799 retail       │
│  Tire & Wheel              [tire_wheel] $   699 retail       │
│  Paint & Interior          [paint]      $   499 retail       │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "tool",
        name: "add_products",
        args: '{ dealId: 1042, productNames: ["GAP Protection", "Vehicle Service Contract"] }',
        note: "Attach by name (case-insensitive partial match) so you never hand-type product IDs.",
      },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  DEAL #1042 · Maria Lopez · status: DEAL        [deal widget] │
│  Products   GAP Protection $895 · VSC $2,495                 │
│  Back gross $1,400                                            │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "button",
        label: "Send to financing →",
        message:
          "Move deal #1042 into financing — submit the customer's credit application.",
        note: "The Deal Viewer button is scope-aware: buyers see [ Apply for financing → ], managers see [ Approve this deal → ].",
      },
    ],
  },
  {
    path: "/mcp/buyer",
    intro:
      "Maria, at home, connected to the buyer endpoint — she only sees her own deal + self-service tools. Tools: browse_inventory, build_quote, view_my_deal, submit_credit_app, check_loan_status.",
    turns: [
      {
        kind: "user",
        text: "What's the status of my RAV4 deal, and can I see my payment?",
      },
      {
        kind: "tool",
        name: "view_my_deal",
        note: "Buyer-scoped Deal Viewer: no gross/cost shown.",
      },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  Your deal · 2023 Toyota RAV4 XLE               [deal widget] │
│  Estimated payment   $528/mo · 72 months · 6.9% APR           │
│  Your trade credit   +$5,300 (2016 Civic)                     │
│  Status: ready for financing — apply below                    │
└──────────────────────────────────────────────────────────────┘`,
      },
      { kind: "user", text: "Let's apply for financing. Income is $78k a year." },
      {
        kind: "tool",
        name: "submit_credit_app",
        args: "{ annualIncome: 78000 }",
        note: "Operates on Maria's latest deal automatically; advances it to credit_submitted.",
      },
      {
        kind: "assistant",
        text: "Your credit application is submitted (#31). The finance office will send it to lenders — I'll show decisions here as they come in.",
      },
      { kind: "user", text: "Any word yet?" },
      { kind: "tool", name: "check_loan_status" },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  Application #31 · Maria Lopez            [credit board]      │
│  ● Submitted          ✓                                       │
│  ● Sent to lenders    … pending                               │
│  ● Decision           … waiting                               │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "button",
        label: "Check for updates →",
        message: "Any update on my loan application?",
        note: "Re-runs check_loan_status to refresh the steps as lenders respond.",
      },
    ],
  },
  {
    path: "/mcp/loan-officer",
    intro:
      "Tools: list_credit_apps, list_lenders, submit_to_lender, record_lender_decision, set_financing_terms, view_deal.",
    turns: [
      { kind: "user", text: "Show me credit apps waiting to go out." },
      { kind: "tool", name: "list_credit_apps", args: '{ status: "submitted" }' },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  CREDIT QUEUE · 3 apps                     [credit board]     │
│  #31 Maria Lopez   · Deal #1042 · $78k inc · SUBMITTED        │
│  #29 Dan Pruitt    · Deal #1039 · $54k inc · IN REVIEW        │
│  #27 A. Cheng      · Deal #1036 · $110k inc· DECISIONED ✓     │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "button",
        label: "Submit →",
        message: "Submit credit application #31 (Maria Lopez) to lenders.",
        note: "Per-app button on any queued app that isn't already decisioned — fire it off straight from the board.",
      },
      { kind: "user", text: "Which lenders can take this one?" },
      {
        kind: "tool",
        name: "list_lenders",
        args: '{ dealType: "finance" }',
        note: "Call this before submit_to_lender so you target the right lenders.",
      },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  LENDERS · finance                                            │
│  #1 Prime Bank            finance/lease · min tier 660 · 5.9% │
│  #2 Capital Credit Union  finance       · min tier 620 · 6.4% │
│  #3 Summit Auto Finance   finance/lease · min tier 580 · 7.9% │
└──────────────────────────────────────────────────────────────┘`,
      },
      { kind: "user", text: "Submit Maria's to Prime Bank and the credit union." },
      {
        kind: "tool",
        name: "submit_to_lender",
        args: '{ creditAppId: 31, lenderNames: ["Prime Bank", "Capital Credit Union"] }',
        note: "Submit by name (case-insensitive partial match) so you don't hand-type lender IDs; this moves the app to in_review.",
      },
      {
        kind: "progress",
        steps: [
          { label: "Submitting to Prime Bank…", progress: 0, total: 2 },
          { label: "Submitting to Capital Credit Union…", progress: 1, total: 2 },
          { label: "All lenders submitted.", progress: 2, total: 2 },
        ],
        note: "When the host sends a progressToken, submit_to_lender streams notifications/progress per lender (short simulated delay) so the host can draw a live progress bar. Falls back to just the final result if the host or platform doesn't stream.",
      },
      {
        kind: "assistant",
        text: "Submitted to Prime Bank and Capital Credit Union. Decisions usually post quickly in the demo.",
      },
      {
        kind: "user",
        text: "Record Prime Bank's decision — approved, 6.4%, 72 months, $33k max.",
      },
      {
        kind: "tool",
        name: "record_lender_decision",
        args: '{ creditAppId: 31, lenderName: "Prime Bank", status: "approved", rate: 6.4, term: 72, maxAmount: 33000 }',
        note: "An approved decision advances the deal to ready; otherwise to lender_decision.",
      },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  App #31 · Maria Lopez                     [credit board]     │
│  Prime Bank        ✅ APPROVED  6.4% · 72mo · max $33,000     │
│  Capital Credit U. ⏳ pending                                 │
│  → Deal #1042 advanced — credit app now DECISIONED            │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "note",
        text: "6.4% beats the 6.9% quote — the buyer's check_loan_status widget now reflects the approval.",
      },
    ],
  },
  {
    path: "/mcp/manager",
    intro:
      "Tools: list_all_deals, deal_profitability, approve_deal, reassign_salesperson, view_deal.",
    turns: [
      { kind: "user", text: "Show me the board — all open deals and their gross." },
      { kind: "tool", name: "list_all_deals", args: "{ openOnly: true }" },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  DEAL BOARD · 5 open                        [dashboard]       │
│  #1042 Lopez   RAV4   Finance  LENDER_DECISION  F$2,140 B$0   │
│  #1039 Pruitt  CX-5   Lease    CREDIT_SUBMITTED F$1,810 B$650 │
│  #1036 Cheng   CR-V   Finance  READY           F$2,400 B$1,200│
│  Total front $8,900 · back $3,100 · avg $2,400/deal           │
└──────────────────────────────────────────────────────────────┘`,
      },
      {
        kind: "button",
        label: "Profitability →",
        message: "Show me the profitability breakdown for deal #1042.",
        note: "Per-row button on the board — the quickest way to drill into a deal.",
      },
      {
        kind: "user",
        text: "Pull up Lopez's profitability — her back-end is zero, why?",
      },
      {
        kind: "tool",
        name: "deal_profitability",
        args: "{ dealId: 1042 }",
        note: "Manager view: full cost/markup.",
      },
      {
        kind: "widget",
        ascii: `┌──────────────────────────────────────────────────────────────┐
│  DEAL #1042 · profitability               [deal widget]      │
│  Front gross  $2,140   (sell $32,995 − cost $30,855)         │
│  Back gross   $0       ← no F&I products sold                 │
│  Reserve      ~$310    (6.9% sold vs 6.4% buy)               │
│  💡 No VSC / GAP attached — $1,400 back-end left on table     │
└──────────────────────────────────────────────────────────────┘`,
      },
      { kind: "user", text: "Approve it and have the salesperson add a GAP product." },
      {
        kind: "tool",
        name: "approve_deal",
        args: "{ dealId: 1042 }",
        note: "Status → ready. The read-only website dashboard at BASE_URL/deals/1042 shows every change live.",
      },
    ],
  },
];
