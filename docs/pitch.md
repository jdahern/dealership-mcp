# Pitch: A2ZSync as an MCP App

**Audience:** manager + product/eng leadership. **Goal:** buy-in for a small, time-boxed spike + a leadership demo. **Throughline:** MCP Apps just became the standard way AI assistants render interactive product UIs, and we already have a working A2ZSync prototype proving it.

> **Reviewed with Sridhar — bought in, presenting to Vito.** Use the framings below. **Note:** the exec-facing version (`docs/executive-summary.md`) is intentionally timeline-free per Sridhar ("never quote time in those calls"); the effort/phase estimates here are for the internal product/eng audience only. Call notes: `docs/call-notes.md`.

**Positioning (lead with these):**
- **"Bring your own AI."** We don't push our own chatbot (contrast Atlassian's Rover). Dealers connect whatever AI they use; we provide the MCP apps. → offloads AI cost *and* hallucination liability to the host; we stay the trusted source of truth.
- **A2ZSync as headless commerce.** Our value is the data + services (CRM, deals, desking/pricing, inventory, lender/DMS); MCP apps ride on top. UI-agnostic.
- **Role-based.** Customer, salesperson, F&I, GSM/manager — each its own connector + scoped view. (Manager view = the "new tower.")
- **Category ahead of chatbots.** Competitors at NADA are selling "a chatbot over their data." This is the apps-on-your-phone moment; chatbots are the thing being replaced.

---

## Elevator pitch (~30 seconds)

> MCP Apps just became the official standard for putting interactive product UIs *inside* AI assistants like ChatGPT and Claude — and the major ones already support it. That means a salesperson, F&I manager, or even a customer can desk a deal, run payments, and submit to lenders by talking to an assistant, with A2ZSync's real numbers rendering right in the chat. I built a working prototype on our own domain — four role-based servers, a live desking widget, the full deal lifecycle — and connected it to Claude and ChatGPT. The hard parts (pricing engine, lender and DMS integrations, the system of record) are things A2ZSync already owns; MCP is a thin layer on top. I want a short, time-boxed spike to wrap a few real APIs behind auth and demo it to leadership.

---

## One-page brief

### A2ZSync as an MCP App — meet dealers (and buyers) inside the AI assistants they already use

**The shift.** Dealership staff and car buyers increasingly *start* tasks in ChatGPT/Claude. In Jan 2026, MCP Apps became the **official MCP extension** for rendering interactive UIs inside those assistants — already supported by **Claude, ChatGPT, VS Code Copilot, Goose, and Postman**. This is a new distribution channel, and it rewards whoever owns the *system of action* behind it.

**The idea.** Expose A2ZSync's existing capabilities as an **MCP server** so users can drive real workflows by conversation, with **trustworthy interactive widgets** (not hallucinated text):
- **Salesperson** — desk a deal end-to-end: customer → inventory → desking quote → trade → F&I products.
- **F&I** — work the credit queue, submit to lenders, record decisions.
- **Manager** — pipeline review, profitability insights, approvals from anywhere.
- **Customer-facing** — self-service shopping + payment estimation inside ChatGPT → a **lead-gen channel** into a dealer's A2ZSync inventory.

**Why it's defensible.** A generic AI can't desk a real deal. A2ZSync owns the **pricing/desking engine (MarketScan), lender connections, DMS integration, and the deal system of record**. Our connector returns *accurate* numbers and **writes back** to the real deal. The interactive widget (real payment calc, live recompute) is what makes it trustworthy and fast — text alone isn't.

**Proof — already built.** A working, deployed prototype modeled directly on our domain: four persona MCP servers, interactive widgets (inventory grid, live desking calculator, deal viewer, credit board, manager dashboard), the full `quoted → deal → credit_submitted → lender_decision → ready` lifecycle, a read-only data-viewer site, connectable to Claude/ChatGPT today. Built in days — because it's a layer over capabilities we already have.

**Feasibility.** MCP is an orchestration/presentation layer; the demo proves the pattern works end-to-end. The real production work is **not** the MCP mechanics — it's **auth (SSO into A2ZSync identities), role/dealership-scoped RBAC, audit logging, and a compliance/legal review** for credit + PII flowing through third-party AI hosts. Those are the gating items and we should scope them up front.

**Risks (named honestly).** Host support is uneven (great on Claude/ChatGPT/Cursor; enterprise plans may gate custom connectors; Open WebUI/LobeChat don't render the widgets yet). Compliance for F&I/credit data in third-party assistants needs legal sign-off. It's additive surface to maintain. None are blockers; all are knowable.

**The ask.** A **time-boxed spike (≈2–3 weeks, 1 eng)** to wrap a few **read-mostly** real APIs (inventory, desking quote, pipeline view) behind proper auth, plus a **leadership demo**. If it lands, a phased roadmap: read → write actions w/ RBAC+audit → customer-facing/lead-gen.

---

## Talking points & objection handling

**Lead with:**
- It's a *distribution* play, not just a feature — A2ZSync shows up where users already are.
- Timing: the standard just stabilized and the big hosts adopted it — early-mover window.
- We already have a working demo on our own data; this is "extend," not "invent."

**Likely objections → responses:**
- *"Is this real or a toy?"* → It's a deployed prototype running the full deal lifecycle across four roles; I'll demo it live. The mechanics are proven; production is about auth/compliance, which we'd scope.
- *"Security/compliance — credit data in ChatGPT?"* → Correct concern, and it's the first workstream, not an afterthought. Start read-mostly + non-PII, get legal involved before any credit/PII write path. (The demo has no auth by design.)
- *"Will hosts even support it / will it break?"* → Supported today by Claude/ChatGPT/Copilot/Goose. We always return a plain-text fallback, so on a host without widget support it degrades gracefully rather than breaks.
- *"Why us, why not a generic AI?"* → Generic AI can't price or write a deal. We own the engine, lenders, DMS, and record. The connector + accurate write-back is the moat.
- *"What does it cost to find out?"* → A 2–3 week spike against real APIs + a demo. Low cost, high signal.

---

## Demo script (what to show, in order — ~5 min)

Run it live; the "aha" is interactivity + real write-back, so let them *click*.

1. **Frame (15s):** "This is A2ZSync's workflows, inside Claude." Open the **Connect page** — show four role connectors with icons.
2. **Salesperson (90s):** prompt *"desk a new deal — Maria wants the silver RAV4, $3k down, 72mo."* → inventory grid renders → desking calculator appears. **Drag the term/down sliders** so they see payments recompute *live*. Add trade + GAP/VSC; deal viewer shows gross.
3. **Hand-off (60s):** switch to **Buyer** connector → *"check my loan status"* → note it's the **same deal**, but buyer view **hides cost/gross** (role scoping). Then **Loan Officer** → submit to lenders → record an approval; watch status advance to `ready`.
4. **Manager (30s):** *"review the pipeline"* → dashboard with profitability + the "no F&I products — gross left on the table" insight.
5. **Punchline (30s):** flip to the **read-only website** and refresh — every change persisted. "All of that was natural language driving real A2ZSync-style data, with trustworthy UI. Now imagine it on our live APIs."

---

## Phased roadmap (if greenlit)

- **Phase 0 — done.** Working prototype proving the pattern (this repo).
- **Phase 1 — spike (≈2–3 wks, 1 eng).** Read-mostly tools (inventory, desking quote, pipeline view) over real A2ZSync APIs, behind SSO; internal/friendly-dealer pilot + leadership demo. Legal/compliance scoping in parallel.
- **Phase 2 — write actions.** create/advance deal, submit credit, etc., with role/dealership RBAC + audit logging.
- **Phase 3 — customer-facing.** Self-service shopping/financing connector as a lead-gen channel into dealer inventory.
