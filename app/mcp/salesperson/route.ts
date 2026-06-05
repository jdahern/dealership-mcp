import { buildHandler } from "@/lib/mcp/register";
import { salespersonPersona } from "@/lib/mcp/personas/salesperson";

export const dynamic = "force-dynamic";

const handler = buildHandler(salespersonPersona);

export const GET = handler;
export const POST = handler;
