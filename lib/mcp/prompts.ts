import { db } from "@/db/client";
import { customers, vehicles } from "@/db/schema";
import type { AppPrompt } from "./register";

// Prompts with autocompleting arguments. The `complete` callbacks query Neon so
// the host's argument autocomplete (completion/complete) reflects live data.

export const quoteForCustomerPrompt: AppPrompt = {
  name: "quote_for_customer",
  title: "Quote for a customer",
  description: "Build a quote for an existing customer (name autocompletes)",
  args: [
    {
      name: "customer",
      description: "Customer name — autocompletes from existing customers",
      required: true,
      complete: async (value) => {
        const rows = await db
          .select({ first: customers.firstName, last: customers.lastName })
          .from(customers);
        const v = value.toLowerCase();
        return rows
          .map((c) => `${c.first} ${c.last}`)
          .filter((n) => n.toLowerCase().includes(v))
          .slice(0, 10);
      },
    },
  ],
  text: (args) =>
    `Build a quote for ${args.customer || "the customer"}: look up their record, pick a suitable vehicle, and present a monthly payment.`,
};

export const browseByMakePrompt: AppPrompt = {
  name: "browse_by_make",
  title: "Browse by make",
  description: "Browse available inventory for a make (make autocompletes)",
  args: [
    {
      name: "make",
      description: "Vehicle make — autocompletes from current inventory",
      required: true,
      complete: async (value) => {
        const rows = await db.selectDistinct({ make: vehicles.make }).from(vehicles);
        const v = value.toLowerCase();
        return rows
          .map((r) => r.make)
          .filter((m) => m.toLowerCase().includes(v))
          .sort()
          .slice(0, 10);
      },
    },
  ],
  text: (args) =>
    `Show me the available ${args.make ?? ""} vehicles and estimate monthly payments.`.replace(
      /\s+/g,
      " ",
    ),
};
