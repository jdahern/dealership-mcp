import { buildHandler } from "@/lib/mcp/register";
import { managerPersona } from "@/lib/mcp/personas/manager";

export const dynamic = "force-dynamic";

const handler = buildHandler(managerPersona);

export const GET = handler;
export const POST = handler;
