import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  boolean,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const dealType = pgEnum("deal_type", ["cash", "finance", "lease"]);
export const dealStatus = pgEnum("deal_status", [
  "quoted",
  "deal",
  "credit_submitted",
  "lender_decision",
  "ready",
]);
export const creditAppStatus = pgEnum("credit_app_status", [
  "draft",
  "submitted",
  "in_review",
  "decisioned",
]);
export const decisionStatus = pgEnum("decision_status", [
  "approved",
  "conditional",
  "declined",
]);
export const productType = pgEnum("product_type", [
  "warranty",
  "gap",
  "maintenance",
  "tire_wheel",
  "paint_protection",
]);
export const vehicleStatus = pgEnum("vehicle_status", [
  "available",
  "pending",
  "sold",
]);
export const staffRole = pgEnum("staff_role", ["salesperson", "manager"]);

// numeric() helper — money stored as numeric(12,2)
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  // self-reference for a co-buyer (nullable). Typed loosely to avoid circular ref.
  coBuyerId: integer("co_buyer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const salespeople = pgTable("salespeople", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  role: staffRole("role").notNull().default("salesperson"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vin: text("vin").notNull(),
  stockNumber: text("stock_number").notNull(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  color: text("color"),
  mileage: integer("mileage").notNull().default(0),
  msrp: money("msrp").notNull(),
  sellingPrice: money("selling_price").notNull(),
  cost: money("cost").notNull(),
  certified: boolean("certified").notNull().default(false),
  status: vehicleStatus("status").notNull().default("available"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lenders = pgTable("lenders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // which deal types this lender supports, e.g. ["finance","lease"]
  supportedDealTypes: text("supported_deal_types").array().notNull(),
  tierMinScore: integer("tier_min_score").notNull().default(600),
  baseRate: numeric("base_rate", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: productType("type").notNull(),
  cost: money("cost").notNull(),
  retailPrice: money("retail_price").notNull(),
  termMonths: integer("term_months"),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  salespersonId: integer("salesperson_id")
    .notNull()
    .references(() => salespeople.id),
  type: dealType("type").notNull().default("finance"),
  status: dealStatus("status").notNull().default("quoted"),
  downPayment: money("down_payment").notNull().default("0"),
  termMonths: integer("term_months"),
  apr: numeric("apr", { precision: 5, scale: 2 }),
  monthlyPayment: money("monthly_payment"),
  frontGross: money("front_gross").notNull().default("0"),
  backGross: money("back_gross").notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tradeIns = pgTable("trade_ins", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id),
  year: integer("year"),
  make: text("make"),
  model: text("model"),
  mileage: integer("mileage"),
  acv: money("acv").notNull().default("0"), // actual cash value
  payoff: money("payoff").notNull().default("0"),
});

export const dealProducts = pgTable("deal_products", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  soldPrice: money("sold_price").notNull(),
});

export const paymentCalculations = pgTable("payment_calculations", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id),
  type: dealType("type").notNull(),
  termMonths: integer("term_months").notNull(),
  apr: numeric("apr", { precision: 5, scale: 2 }).notNull().default("0"),
  downPayment: money("down_payment").notNull().default("0"),
  monthlyPayment: money("monthly_payment").notNull(),
  scenarioLabel: text("scenario_label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditApps = pgTable("credit_apps", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id),
  status: creditAppStatus("status").notNull().default("draft"),
  ssnLast4: text("ssn_last4"),
  annualIncome: money("annual_income"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

export const lenderSubmissions = pgTable("lender_submissions", {
  id: serial("id").primaryKey(),
  creditAppId: integer("credit_app_id")
    .notNull()
    .references(() => creditApps.id),
  lenderId: integer("lender_id")
    .notNull()
    .references(() => lenders.id),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loanDecisions = pgTable("loan_decisions", {
  id: serial("id").primaryKey(),
  lenderSubmissionId: integer("lender_submission_id")
    .notNull()
    .references(() => lenderSubmissions.id),
  status: decisionStatus("status").notNull(),
  approvedRate: numeric("approved_rate", { precision: 5, scale: 2 }),
  approvedTermMonths: integer("approved_term_months"),
  maxAmount: money("max_amount"),
  stipulations: text("stipulations"),
  decisionedAt: timestamp("decisioned_at", { withTimezone: true }).defaultNow().notNull(),
});
