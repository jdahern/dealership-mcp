import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// neon-http: one-shot HTTP queries, ideal for serverless route handlers and the
// per-request lifecycle of MCP tool calls. Do NOT hold a long-lived pool at
// module scope. (Multi-statement transactions are unsupported over http; all
// our writes are single-row, so this is fine.)
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
export { schema };
