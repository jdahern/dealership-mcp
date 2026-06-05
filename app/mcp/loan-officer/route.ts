import { buildHandler } from "@/lib/mcp/register";
import { loanOfficerPersona } from "@/lib/mcp/personas/loanOfficer";

export const dynamic = "force-dynamic";
// submit_to_lender streams progress with short simulated lender delays; give the
// serverless function headroom beyond the default so the stream completes.
export const maxDuration = 60;

const handler = buildHandler(loanOfficerPersona);

export const GET = handler;
export const POST = handler;
