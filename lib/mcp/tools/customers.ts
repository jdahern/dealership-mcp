import { z } from "zod";
import { db } from "@/db/client";
import { customers } from "@/db/schema";
import type { AppToolDef } from "../register";
import { customerOutput } from "../schemas";
import { text } from "./helpers";

export const createCustomer: AppToolDef = {
  name: "create_customer",
  title: "Create Customer",
  description: "Create a new customer (buyer) record.",
  inputSchema: {
    firstName: z.string().describe("Customer first name"),
    lastName: z.string().describe("Customer last name"),
    email: z.string().optional().describe("Email address"),
    phone: z.string().optional().describe("Phone number"),
    address: z.string().optional().describe("Mailing address"),
  },
  outputSchema: customerOutput,
  annotations: { readOnlyHint: false, idempotentHint: false },
  handler: async ({ firstName, lastName, email, phone, address }) => {
    const [row] = await db
      .insert(customers)
      .values({
        firstName: String(firstName),
        lastName: String(lastName),
        email: email ? String(email) : null,
        phone: phone ? String(phone) : null,
        address: address ? String(address) : null,
      })
      .returning();

    return {
      content: text(
        `Created customer #${row.id}: ${row.firstName} ${row.lastName}.`,
      ),
      structuredContent: {
        kind: "customer",
        customer: {
          id: row.id,
          name: `${row.firstName} ${row.lastName}`,
          email: row.email,
          phone: row.phone,
        },
      },
    };
  },
};
