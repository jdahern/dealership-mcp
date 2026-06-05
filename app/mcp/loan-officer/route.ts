import { buildHandler } from "@/lib/mcp/register";
import { loanOfficerPersona } from "@/lib/mcp/personas/loanOfficer";

export const dynamic = "force-dynamic";

const handler = buildHandler(loanOfficerPersona);

export const GET = handler;
export const POST = handler;
