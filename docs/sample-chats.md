# Sample Persona Chats

Illustrative demo interactions for each of the four MCP persona endpoints. These are grounded in the actual registered tools and widgets, and threaded into **one continuous storyline** — a single deal (Maria Lopez buying a 2023 RAV4) moving across personas — to show how the shared Postgres data changes hands.

Notation: `🔧 tool_name { args }` = an MCP tool call. `[… widget]` blocks = what renders inside the host iframe.

Persona identities are fixed (there is no auth in the demo): the **salesperson acts as Jordan Reyes** and the **buyer acts as Maria Lopez**. The buyer's `submit_credit_app` / `check_loan_status` / `view_my_deal` always operate on Maria's latest deal.

A deal moves through this exact lifecycle: `quoted → deal → credit_submitted → lender_decision → ready`.

> **Note:** The specific numeric IDs below (deal #1042, app #31, etc.) are illustrative. Real IDs are serial and will differ from run to run — the tools resolve customers, products, and lenders for you, so you generally don't type IDs by hand.

---

## 1. Salesperson — `/mcp/salesperson`

*(Acting as Jordan Reyes. Tools: `create_customer`, `browse_inventory`, `build_quote`, `create_deal`, `add_trade_in`, `list_products`, `add_products`, `view_deal`, `list_my_deals`.)*

> **You:** New up Maria Lopez, she&apos;s interested in the silver RAV4 we have. Phone 555-0142, email maria.lopez@gmail.com.

**🔧 `create_customer`** `{ firstName: "Maria", lastName: "Lopez", phone: "555-0142", email: "maria.lopez@gmail.com" }` → `{ id: 14, name: "Maria Lopez", … }`
> Created Maria Lopez (#14). Want me to pull up the RAV4 and start a quote?

> **You:** Yeah, show me what&apos;s on the lot under $35k.

**🔧 `browse_inventory`** `{ maxPrice: 35000 }` → renders **Inventory Grid widget**

```
┌──────────────────────────────────────────────────────────────┐
│  INVENTORY · 6 vehicles ≤ $35,000              [grid widget]   │
├──────────────────────────────────────────────────────────────┤
│ 🚗 2023 Toyota RAV4 XLE   · Silver · 12,400 mi · $32,995  CPO │
│ 🚗 2022 Honda CR-V EX     · Blue   · 28,100 mi · $29,450      │
│ 🚗 2024 Mazda CX-5        · White  ·  4,200 mi · $33,900      │
│ … (click a row to select)                                     │
└──────────────────────────────────────────────────────────────┘
```

> **You:** The RAV4. Build a finance quote, $3k down, 72 months.

**🔧 `build_quote`** `{ vehicleId: 7, type: "finance", down: 3000, term: 72 }` → renders **Desking Calculator widget**

```
┌──────────────────────────────────────────────────────────────┐
│  DESKING · 2023 Toyota RAV4 XLE · $32,995      [calc widget]  │
├──────────────────────────────────────────────────────────────┤
│  Finance  | Cash | Lease            Down: [$3,000]  Term:[72] │
│  ─────────────────────────────────────────────────────────── │
│  Amount financed   $31,240    (incl. tax + $699 doc)          │
│  Est. APR          6.9%                                       │
│  ▶  Monthly        $528 / mo                                  │
│                                                               │
│  [ 48mo $689 ] [ 60mo $586 ] [ 72mo $528 ]  ← click to recalc │
└──────────────────────────────────────────────────────────────┘
```
*(Clicking a term chip calls `build_quote` again via `callServerTool` — recomputes in-place, no new chat turn.)*

> **You:** Good. Create the deal and add her trade — 2016 Civic, 95k miles, she owes about $4,200.

**🔧 `create_deal`** `{ customerId: 14, vehicleId: 7, type: "finance", down: 3000, term: 72 }` → **🔧 `add_trade_in`** `{ dealId: 1042, year: 2016, make: "Honda", model: "Civic", mileage: 95000, acv: 9500, payoff: 4200 }` → renders **Deal Viewer widget**

```
┌──────────────────────────────────────────────────────────────┐
│  DEAL #1042 · Maria Lopez · status: DEAL        [deal widget] │
├──────────────────────────────────────────────────────────────┤
│  Vehicle    2023 RAV4 XLE              $32,995                │
│  Trade-in   2016 Civic (ACV $9,500 − payoff $4,200) = +$5,300│
│  Products   —                                                 │
│  Type       Finance · 72mo · 6.9%      Payment  $528/mo       │
│  Front gross $2,140                                           │
└──────────────────────────────────────────────────────────────┘
```

> **You:** What F&I products can I attach? Add GAP and a service contract.

**🔧 `list_products`** → renders **Products Menu widget** *(always call this before `add_products` so you attach the right product — no guessing IDs)*

```
┌──────────────────────────────────────────────────────────────┐
│  F&I MENU · 5 products                       [products widget]│
├──────────────────────────────────────────────────────────────┤
│  Vehicle Service Contract  [warranty]   $2,495 retail        │
│  GAP Protection            [gap]        $   895 retail       │
│  Prepaid Maintenance       [maintenance]$   799 retail       │
│  Tire & Wheel              [tire_wheel] $   699 retail       │
│  Paint & Interior          [paint]      $   499 retail       │
└──────────────────────────────────────────────────────────────┘
```

**🔧 `add_products`** `{ dealId: 1042, productNames: ["GAP Protection", "Vehicle Service Contract"] }` → **Deal Viewer** updates *(attach by name — case-insensitive partial match — so you never hand-type product IDs)*

```
┌──────────────────────────────────────────────────────────────┐
│  DEAL #1042 · Maria Lopez · status: DEAL        [deal widget] │
│  Products   GAP Protection $895 · VSC $2,495                 │
│  Back gross $1,400                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Buyer — `/mcp/buyer`

*(Maria, at home, connected to the buyer endpoint — she only sees her own deal + self-service tools. Tools: `browse_inventory`, `build_quote`, `view_my_deal`, `submit_credit_app`, `check_loan_status`.)*

> **You (Maria):** What&apos;s the status of my RAV4 deal, and can I see my payment?

**🔧 `view_my_deal`** → renders **Deal Viewer** (buyer-scoped: no gross/cost shown)

```
┌──────────────────────────────────────────────────────────────┐
│  Your deal · 2023 Toyota RAV4 XLE               [deal widget] │
│  Estimated payment   $528/mo · 72 months · 6.9% APR           │
│  Your trade credit   +$5,300 (2016 Civic)                     │
│  Status: ready for financing — apply below                    │
└──────────────────────────────────────────────────────────────┘
```

> **You (Maria):** Let&apos;s apply for financing. Income is $78k a year.

**🔧 `submit_credit_app`** `{ annualIncome: 78000 }` → `{ creditAppId: 31, status: "submitted" }` *(operates on Maria&apos;s latest deal automatically; advances it to `credit_submitted`)*
> Your credit application is submitted (#31). The finance office will send it to lenders — I&apos;ll show decisions here as they come in.

> **You (Maria):** Any word yet?

**🔧 `check_loan_status`** → renders **Credit Status widget**

```
┌──────────────────────────────────────────────────────────────┐
│  Application #31 · Maria Lopez            [credit board]      │
│  ● Submitted          ✓                                       │
│  ● Sent to lenders    … pending                               │
│  ● Decision           … waiting                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Loan Officer (F&I) — `/mcp/loan-officer`

*(Tools: `list_credit_apps`, `list_lenders`, `submit_to_lender`, `record_lender_decision`, `set_financing_terms`, `view_deal`.)*

> **You:** Show me credit apps waiting to go out.

**🔧 `list_credit_apps`** `{ status: "submitted" }` → renders **Credit Board widget**

```
┌──────────────────────────────────────────────────────────────┐
│  CREDIT QUEUE · 3 apps                     [credit board]     │
│  #31 Maria Lopez   · Deal #1042 · $78k inc · SUBMITTED        │
│  #29 Dan Pruitt    · Deal #1039 · $54k inc · IN REVIEW        │
│  #27 A. Cheng      · Deal #1036 · $110k inc· DECISIONED ✓     │
└──────────────────────────────────────────────────────────────┘
```

> **You:** Which lenders can take this one?

**🔧 `list_lenders`** `{ dealType: "finance" }` → lists lenders with their IDs, supported deal types, min tier, and base rate *(call this before `submit_to_lender` so you target the right lenders)*

```
┌──────────────────────────────────────────────────────────────┐
│  LENDERS · finance                                            │
│  #1 Prime Bank            finance/lease · min tier 660 · 5.9% │
│  #2 Capital Credit Union  finance       · min tier 620 · 6.4% │
│  #3 Summit Auto Finance   finance/lease · min tier 580 · 7.9% │
└──────────────────────────────────────────────────────────────┘
```

> **You:** Submit Maria&apos;s to Prime Bank and the credit union.

**🔧 `submit_to_lender`** `{ creditAppId: 31, lenderNames: ["Prime Bank", "Capital Credit Union"] }` *(submit by name — case-insensitive partial match — so you don&apos;t hand-type lender IDs; this moves the app to `in_review`)*
> Submitted to Prime Bank and Capital Credit Union. Decisions usually post quickly in the demo.

> **You:** Record Prime Bank&apos;s decision — approved, 6.4%, 72 months, $33k max.

**🔧 `record_lender_decision`** `{ creditAppId: 31, lenderName: "Prime Bank", status: "approved", rate: 6.4, term: 72, maxAmount: 33000 }` → **Credit Board** updates *(an `approved` decision advances the deal to `ready`; otherwise to `lender_decision`)*

```
┌──────────────────────────────────────────────────────────────┐
│  App #31 · Maria Lopez                     [credit board]     │
│  Prime Bank        ✅ APPROVED  6.4% · 72mo · max $33,000     │
│  Capital Credit U. ⏳ pending                                 │
│  → Deal #1042 advanced — credit app now DECISIONED            │
└──────────────────────────────────────────────────────────────┘
```
*(Note: 6.4% beats the 6.9% quote — the buyer&apos;s `check_loan_status` widget now reflects the approval.)*

---

## 4. Manager — `/mcp/manager`

*(Tools: `list_all_deals`, `deal_profitability`, `approve_deal`, `reassign_salesperson`, `view_deal`.)*

> **You:** Show me the board — all open deals and their gross.

**🔧 `list_all_deals`** `{ openOnly: true }` → renders **Manager Dashboard widget**

```
┌──────────────────────────────────────────────────────────────┐
│  DEAL BOARD · 5 open                        [dashboard]       │
│  #1042 Lopez   RAV4   Finance  LENDER_DECISION  F$2,140 B$0   │
│  #1039 Pruitt  CX-5   Lease    CREDIT_SUBMITTED F$1,810 B$650 │
│  #1036 Cheng   CR-V   Finance  READY           F$2,400 B$1,200│
│  Total front $8,900 · back $3,100 · avg $2,400/deal           │
└──────────────────────────────────────────────────────────────┘
```

> **You:** Pull up Lopez&apos;s profitability — her back-end is zero, why?

**🔧 `deal_profitability`** `{ dealId: 1042 }` → **Deal Viewer** (manager: full cost/markup)

```
┌──────────────────────────────────────────────────────────────┐
│  DEAL #1042 · profitability               [deal widget]      │
│  Front gross  $2,140   (sell $32,995 − cost $30,855)         │
│  Back gross   $0       ← no F&I products sold                 │
│  Reserve      ~$310    (6.9% sold vs 6.4% buy)               │
│  💡 No VSC / GAP attached — $1,400 back-end left on table     │
└──────────────────────────────────────────────────────────────┘
```

> **You:** Approve it and have the salesperson add a GAP product.

**🔧 `approve_deal`** `{ dealId: 1042 }` → status → `ready`. *(Meanwhile the read-only website dashboard at `BASE_URL/deals/1042` shows every one of these changes live.)*

---

## What this illustrates about the design

- Each persona endpoint exposes **only its slice** of tools and a **scoped view** of the same data (buyer never sees gross/cost; manager sees everything).
- Tools that touch a catalog of records — `list_products`, `list_lenders` — are called **first**, then the action tool attaches **by name** (`productNames`, `lenderNames`, `lenderName`) so the model never has to guess serial IDs.
- The **same deal** flows `deal → credit_submitted → lender_decision → ready` across four separate MCP connections, all backed by one shared database.
- Widgets are **interactive** (term chips recompute via `callServerTool`), not static.
