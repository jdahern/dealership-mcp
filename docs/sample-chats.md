# Sample Persona Chats

Illustrative demo interactions for each of the four MCP persona endpoints. These are grounded in the actual registered tools and widgets, and threaded into **one continuous storyline** — a single deal (Maria Lopez buying a 2023 RAV4) moving across personas — to show how the shared Postgres data changes hands.

Notation: `🔧 tool_name { args }` = an MCP tool call. `[… widget]` blocks = what renders inside the host iframe. `[ Label → ]` = an in-widget button that injects a chat message via `app.sendMessage` to move the flow forward (these only render when the host advertises the `message` capability — otherwise you just ask in chat).

Each persona also registers one **starter prompt** — a server-defined conversation starter the host can surface. How it appears is host-defined (a slash command, a starter chip, etc.).

Persona identities are fixed (there is no auth in the demo): the **salesperson acts as Jordan Reyes** and the **buyer acts as Maria Lopez**. The buyer's `submit_credit_app` / `check_loan_status` / `view_my_deal` always operate on Maria's latest deal.

A deal moves through this exact lifecycle: `quoted → deal → credit_submitted → lender_decision → ready`.

> **Note:** The specific numeric IDs below (deal #1042, app #31, etc.) are illustrative. Real IDs are serial and will differ from run to run — the tools resolve customers, products, and lenders for you, so you generally don't type IDs by hand.

---

## 1. Salesperson — `/mcp/salesperson`

*(Acting as Jordan Reyes. Tools: `create_customer`, `browse_inventory`, `build_quote`, `create_deal`, `add_trade_in`, `list_products`, `add_products`, `view_deal`, `list_my_deals`.)*

> **Starter prompt:** **Desk a new deal** (`desk_a_deal`) — a guided flow to desk a deal from scratch (create the customer, browse inventory, build a quote, add a trade-in and F&I products).

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
*(Each card has a **[ Get a quote → ]** button — clicking it injects `I&apos;d like a quote on the {year} {make} {model} (vehicle #{id}).` as a chat turn, so the buyer can move forward without typing.)*

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
*(Clicking a term chip calls `build_quote` again via `callServerTool` — recomputes in-place, no new chat turn. Because this quote isn&apos;t saved to a deal yet, the widget shows a **[ Create this deal → ]** button that injects a "create a finance deal on the RAV4…" message; once a deal exists it becomes **[ Apply for financing → ]** instead.)*

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

*(The Deal Viewer is scope-aware: on the salesperson endpoint it shows a **[ Send to financing → ]** button that injects "Move deal #1042 into financing — submit the customer&apos;s credit application." The same widget shows **[ Apply for financing → ]** for the buyer and **[ Approve this deal → ]** for the manager.)*

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

> **Starter prompt:** **Find a car & payment** (`find_a_car`) — browse inventory, estimate a monthly payment, and build a quote on one she likes.

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
*(The buyer&apos;s status view has a **[ Check for updates → ]** button that injects "Any update on my loan application?" — re-running `check_loan_status` to refresh the steps as lenders respond.)*

---

## 3. Loan Officer (F&I) — `/mcp/loan-officer`

*(Tools: `list_credit_apps`, `list_lenders`, `submit_to_lender`, `record_lender_decision`, `set_financing_terms`, `view_deal`.)*

> **Starter prompt:** **Work my credit queue** (`work_credit_queue`) — review queued credit apps, submit them to appropriate lenders, and record the decisions.

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
*(Each queued app that isn&apos;t already decisioned has a **[ Submit → ]** button — clicking it injects `Submit credit application #{id} ({customer}) to lenders.` so you can fire it off straight from the board.)*

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

When the host includes a `progressToken`, `submit_to_lender` streams `notifications/progress` as it contacts each lender (with a short simulated delay), so the host can draw a live progress bar before the final result lands:

```
Submitting to Prime Bank…              [█░░░░░░░░░]  0/2
Submitting to Capital Credit Union…    [█████░░░░░]  1/2
All lenders submitted.                 [██████████]  2/2
→ result: Submitted credit app #31 to Prime Bank, Capital Credit Union.
```
*(Live rendering depends on the host drawing progress and on the platform not buffering the streamed response — if either doesn&apos;t happen, it gracefully falls back to just returning the final result. Without a `progressToken`, no delay is added.)*

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

> **Starter prompt:** **Review the pipeline** (`review_pipeline`) — a rundown of all open deals, flagging any with weak front gross or no F&I products.

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
*(Each row has a **[ Profitability → ]** button that injects `Show me the profitability breakdown for deal #{id}.` — the quickest way to drill in from the board.)*

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
- Widgets can also **talk back to the chat**: scope-aware `[ … → ]` buttons inject a user message via `app.sendMessage` to advance the flow (quote → deal → financing → decision), and each persona ships a **starter prompt** as a recommended entry point.
- Long-running tools **stream progress**: `submit_to_lender` emits `notifications/progress` per lender so the host can show a live progress bar, falling back gracefully when the host or platform doesn&apos;t support streaming.
