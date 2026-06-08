# Call notes — MCP Apps idea review

**Participants:** Jeff Ahern, Sridhar Chinta. **Source:** `docs/Jeff-s-MCP-Idea-Review-fbf5f1e2-a1cf.json` (recorded review).

## Outcome
Sridhar is bought in — *"you may be onto something really good… I like it."* He wants to **present this to Vito** (tried to pull him into the call live; Vito to see it soon). Jeff to provide a high-level write-up; Sridhar adds an executive summary and presents.

## Framings that landed (use these)
- **"Bring your own AI"** — don't push our own LLM (contrast: Atlassian's Rover). Integrate with whatever AI the dealer uses; we provide the MCP apps.
- **A2ZSync as headless commerce** — build MCP servers on top of headless APIs; UI-agnostic. We are *the MCP server builder* that connects to the dealer's CRM, deal DB, pricing, inventory, DMS.
- **Role-based** — customer, salesperson, F&I, GSM/manager. Summarize *by role*.
- **Anti-chatbot / liability** — competitors (NADA floor) sell "a chatbot over their data." MCP apps is the category ahead ("apps on your phone"). BYO-AI offloads hallucination liability + token cost ("let them pay for the AI"). Prediction: chatbots fade.
- **The manager view is the "new tower."**

## Decisions / direction
- **Jeff →** high-level, **by-role**, **no-detail** summary for Sridhar to wrap. (See `docs/executive-summary.md`.)
- **Sridhar →** writes the executive summary and presents to Vito; wants it before he's out.
- **Jeff →** present the live demo when leadership is ready.
- **Rule for exec calls:** *never quote timelines/effort.* "Show the concept; how long it takes is nobody's business." (Effort estimates live only in the internal `docs/pitch.md`.)
- Position as: **"this is the future / where we want to go"**, leveraging that we're already in the business — no special new skills, no brand-new app to build from scratch.

## Phasing
- **Phase 1 (internal, "safer"):** salesperson / F&I / manager.
- **Phase 2 (customer-facing):** buyer self-service shopping + financing.
- (We can also stand up our own AI front-end — e.g. Open WebUI or our own — but BYO-AI is the model; pricing TBD.)

## Logistics
- Sridhar **OOO** Wed → following Tue (back second half of Tue). Wants to present before leaving if possible.
- Demo link shared: the deployed dealership-MCP Vercel app (real DB; per-persona MCP servers; `/help` connect page; `/examples` walkthroughs).

## Open items to scope later (not for the exec call)
- Auth/SSO into A2ZSync identities; role/dealership-scoped RBAC; audit logging.
- Compliance/legal review for credit + PII flowing through third-party AI hosts.
- Host availability (enterprise plans gating custom connectors; Open WebUI/LobeChat don't render widgets yet).
