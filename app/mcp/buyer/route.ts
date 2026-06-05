import { buildHandler } from "@/lib/mcp/register";
import { buyerPersona } from "@/lib/mcp/personas/buyer";

export const dynamic = "force-dynamic";

const handler = buildHandler(buyerPersona);

export const GET = handler;
export const POST = handler;
