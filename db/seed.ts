import "dotenv/config";
import { db } from "./client";
import {
  customers,
  salespeople,
  vehicles,
  lenders,
  products,
  deals,
  tradeIns,
  dealProducts,
  paymentCalculations,
  creditApps,
  lenderSubmissions,
  loanDecisions,
} from "./schema";
import { buildQuote } from "../lib/mcp/payment-math";

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=640&q=60`;

async function main() {
  console.log("Clearing existing data…");
  // delete in FK-safe order
  await db.delete(loanDecisions);
  await db.delete(lenderSubmissions);
  await db.delete(creditApps);
  await db.delete(paymentCalculations);
  await db.delete(dealProducts);
  await db.delete(tradeIns);
  await db.delete(deals);
  await db.delete(products);
  await db.delete(lenders);
  await db.delete(vehicles);
  await db.delete(salespeople);
  await db.delete(customers);

  // -- Staff ----------------------------------------------------------------
  const staff = await db
    .insert(salespeople)
    .values([
      { name: "Jordan Reyes", email: "jordan@demodealer.com", role: "salesperson" },
      { name: "Sam Okafor", email: "sam@demodealer.com", role: "salesperson" },
      { name: "Priya Nair", email: "priya@demodealer.com", role: "salesperson" },
      { name: "Chris Bell", email: "chris@demodealer.com", role: "salesperson" },
      { name: "Dana Whitfield", email: "dana@demodealer.com", role: "manager" },
    ])
    .returning();
  const sp = (name: string) => staff.find((s) => s.name === name)!.id;

  // -- Vehicles -------------------------------------------------------------
  const veh = await db
    .insert(vehicles)
    .values([
      { vin: "JTMRWRFV5PD123456", stockNumber: "T7841", year: 2023, make: "Toyota", model: "RAV4", trim: "XLE", color: "Silver", mileage: 12400, msrp: "34120", sellingPrice: "32995", cost: "30855", certified: true, imageUrl: img("photo-1568605117036-5fe5e7bab0b7") },
      { vin: "7FARW2H58NE000001", stockNumber: "H5520", year: 2022, make: "Honda", model: "CR-V", trim: "EX", color: "Blue", mileage: 28100, msrp: "31200", sellingPrice: "29450", cost: "27300", certified: false, imageUrl: img("photo-1494976388531-d1058494cdd8") },
      { vin: "JM3KFBCM7R0000002", stockNumber: "M9013", year: 2024, make: "Mazda", model: "CX-5", trim: "Premium", color: "White", mileage: 4200, msrp: "35400", sellingPrice: "33900", cost: "31600", certified: false, imageUrl: img("photo-1503376780353-7e6692767b70") },
      { vin: "1FTFW1E84PFA00003", stockNumber: "F2201", year: 2023, make: "Ford", model: "F-150", trim: "Lariat", color: "Black", mileage: 18900, msrp: "58900", sellingPrice: "55400", cost: "51800", certified: true, imageUrl: img("photo-1605559424843-9e4c228bf1c2") },
      { vin: "5YJ3E1EA7PF000004", stockNumber: "E8842", year: 2023, make: "Tesla", model: "Model 3", trim: "RWD", color: "Red", mileage: 9100, msrp: "42990", sellingPrice: "39900", cost: "37200", certified: false, imageUrl: img("photo-1560958089-b8a1929cea89") },
      { vin: "1G1ZD5ST7PF000005", stockNumber: "C4410", year: 2022, make: "Chevrolet", model: "Malibu", trim: "LT", color: "Gray", mileage: 33400, msrp: "26800", sellingPrice: "24300", cost: "22100", certified: false, imageUrl: img("photo-1552519507-da3b142c6e3d") },
      { vin: "WBA5R1C50PF000006", stockNumber: "B1190", year: 2024, make: "BMW", model: "330i", trim: "xDrive", color: "White", mileage: 6200, msrp: "49900", sellingPrice: "47200", cost: "44100", certified: true, imageUrl: img("photo-1555215695-3004980ad54e") },
      { vin: "KM8J3CAL5PU000007", stockNumber: "Y3302", year: 2023, make: "Hyundai", model: "Tucson", trim: "SEL", color: "Green", mileage: 15600, msrp: "30100", sellingPrice: "28400", cost: "26200", certified: false, imageUrl: img("photo-1606664515524-ed2f786a0bd6") },
      { vin: "3VW7M7BU0PM000008", stockNumber: "V6651", year: 2022, make: "Volkswagen", model: "Jetta", trim: "SE", color: "Blue", mileage: 41200, msrp: "24600", sellingPrice: "21900", cost: "19800", certified: false, imageUrl: img("photo-1517994112540-009c47ea476b") },
      { vin: "5XYP3DHC5PG000009", stockNumber: "K7724", year: 2024, make: "Kia", model: "Telluride", trim: "SX", color: "Black", mileage: 3100, msrp: "48700", sellingPrice: "46900", cost: "43900", certified: false, imageUrl: img("photo-1533473359331-0135ef1b58bf") },
      { vin: "1C4RJFBG5PC000010", stockNumber: "J8810", year: 2023, make: "Jeep", model: "Grand Cherokee", trim: "Limited", color: "Silver", mileage: 22300, msrp: "52400", sellingPrice: "48900", cost: "45600", certified: true, imageUrl: img("photo-1519641471654-76ce0107ad1b") },
      { vin: "4T1G11AK7PU000011", stockNumber: "T3318", year: 2023, make: "Toyota", model: "Camry", trim: "SE", color: "Gray", mileage: 17800, msrp: "29800", sellingPrice: "27600", cost: "25400", certified: false, imageUrl: img("photo-1621007947382-bb3c3994e3fb") },
      { vin: "2HKRS4H79PH000012", stockNumber: "H2204", year: 2024, make: "Honda", model: "Accord", trim: "Touring", color: "White", mileage: 5400, msrp: "38900", sellingPrice: "37100", cost: "34600", certified: false, imageUrl: img("photo-1606152421802-db97b9c7a11b") },
      { vin: "SADCJ2EX5PA000013", stockNumber: "L9930", year: 2022, make: "Jaguar", model: "F-PACE", trim: "S", color: "Blue", mileage: 26100, msrp: "61200", sellingPrice: "54900", cost: "50800", certified: true, imageUrl: img("photo-1492144534655-ae79c964c9d7") },
      { vin: "1GKS2BKC5PR000014", stockNumber: "G5540", year: 2023, make: "GMC", model: "Yukon", trim: "Denali", color: "Black", mileage: 19400, msrp: "78900", sellingPrice: "73200", cost: "68900", certified: false, imageUrl: img("photo-1519245659620-e859806a8d3b") },
      { vin: "WP0AB2A99PS000015", stockNumber: "P1101", year: 2024, make: "Subaru", model: "Outback", trim: "Limited", color: "Green", mileage: 8800, msrp: "37400", sellingPrice: "35600", cost: "33100", certified: false, imageUrl: img("photo-1533473359331-0135ef1b58bf") },
      { vin: "5N1AZ2DS5PC000016", stockNumber: "N4423", year: 2022, make: "Nissan", model: "Murano", trim: "SV", color: "Gray", mileage: 35900, msrp: "34100", sellingPrice: "30200", cost: "27600", certified: false, imageUrl: img("photo-1542362567-b07e54358753") },
      { vin: "1FMCU9J94PUA00017", stockNumber: "F7715", year: 2023, make: "Ford", model: "Escape", trim: "Titanium", color: "Red", mileage: 14200, msrp: "33800", sellingPrice: "31400", cost: "29000", certified: true, imageUrl: img("photo-1551830820-330a71b99659") },
      { vin: "3FA6P0H75PR000018", stockNumber: "T9982", year: 2024, make: "Toyota", model: "Highlander", trim: "XLE", color: "Black", mileage: 6900, msrp: "44900", sellingPrice: "42800", cost: "39900", certified: false, imageUrl: img("photo-1581540222194-0def2dda95b8") },
      { vin: "WAUENAF40PA000019", stockNumber: "A2256", year: 2023, make: "Audi", model: "A4", trim: "Premium Plus", color: "White", mileage: 11700, msrp: "47600", sellingPrice: "44100", cost: "41200", certified: true, imageUrl: img("photo-1606664515524-ed2f786a0bd6") },
    ])
    .returning();
  const vstock = (s: string) => veh.find((v) => v.stockNumber === s)!.id;

  // -- Customers ------------------------------------------------------------
  const cust = await db
    .insert(customers)
    .values([
      { firstName: "Maria", lastName: "Lopez", email: "maria.lopez@gmail.com", phone: "555-0142", address: "412 Maple Ave, Austin, TX" },
      { firstName: "Dan", lastName: "Pruitt", email: "dan.pruitt@gmail.com", phone: "555-0177", address: "88 Birch St, Round Rock, TX" },
      { firstName: "Aaron", lastName: "Cheng", email: "a.cheng@outlook.com", phone: "555-0193", address: "9 Cedar Ct, Pflugerville, TX" },
      { firstName: "Nina", lastName: "Patel", email: "nina.patel@gmail.com", phone: "555-0201", address: "230 Oak Blvd, Austin, TX" },
      { firstName: "Marcus", lastName: "Webb", email: "marcus.webb@gmail.com", phone: "555-0218", address: "17 Pine Way, Cedar Park, TX" },
      { firstName: "Elena", lastName: "Webb", email: "elena.webb@gmail.com", phone: "555-0219", address: "17 Pine Way, Cedar Park, TX" },
    ])
    .returning();
  const cu = (first: string) => cust.find((c) => c.firstName === first)!.id;
  // Elena is Marcus's co-buyer
  await db
    .update(customers)
    .set({ coBuyerId: cu("Elena") })
    .where(eqId(customers.id, cu("Marcus")));

  // -- Lenders --------------------------------------------------------------
  const lend = await db
    .insert(lenders)
    .values([
      { name: "Prime Bank", supportedDealTypes: ["finance", "lease"], tierMinScore: 680, baseRate: "6.40" },
      { name: "Capital Credit Union", supportedDealTypes: ["finance"], tierMinScore: 640, baseRate: "6.90" },
      { name: "SubPrime Auto Finance", supportedDealTypes: ["finance"], tierMinScore: 560, baseRate: "12.50" },
      { name: "Captive Lease Co", supportedDealTypes: ["lease"], tierMinScore: 660, baseRate: "5.50" },
    ])
    .returning();
  const le = (name: string) => lend.find((l) => l.name === name)!.id;

  // -- Products -------------------------------------------------------------
  const prod = await db
    .insert(products)
    .values([
      { name: "Vehicle Service Contract (72mo)", type: "warranty", cost: "1100", retailPrice: "2495", termMonths: 72 },
      { name: "GAP Protection", type: "gap", cost: "320", retailPrice: "895" },
      { name: "Prepaid Maintenance (3yr)", type: "maintenance", cost: "480", retailPrice: "1195", termMonths: 36 },
      { name: "Tire & Wheel Protection", type: "tire_wheel", cost: "260", retailPrice: "799" },
      { name: "Paint & Interior Protection", type: "paint_protection", cost: "210", retailPrice: "699" },
      { name: "Extended Warranty (100k)", type: "warranty", cost: "1450", retailPrice: "2995", termMonths: 84 },
      { name: "Key Replacement Plan", type: "maintenance", cost: "90", retailPrice: "349" },
      { name: "GAP Plus", type: "gap", cost: "390", retailPrice: "1095" },
    ])
    .returning();
  const pr = (name: string) => prod.find((p) => p.name === name)!.id;

  // helper to attach a quote's monthly payment
  const q = (price: number, type: "cash" | "finance" | "lease", down: number, term: number, apr: number, tradeEquity = 0) =>
    buildQuote(type, { price, down, term, apr, tradeEquity });

  // === Deal A — Maria Lopez / RAV4 — status: deal (vehicle + trade) ========
  const ravPrice = 32995;
  const aQuote = q(ravPrice, "finance", 3000, 72, 6.9, 5300);
  const [dealA] = await db
    .insert(deals)
    .values({
      customerId: cu("Maria"), vehicleId: vstock("T7841"), salespersonId: sp("Jordan Reyes"),
      type: "finance", status: "deal", downPayment: "3000", termMonths: 72, apr: "6.90",
      monthlyPayment: String(aQuote.monthlyPayment), frontGross: "2140", backGross: "0",
      notes: "Hot lead — silver RAV4, trading a Civic.",
    })
    .returning();
  await db.insert(tradeIns).values({ dealId: dealA.id, year: 2016, make: "Honda", model: "Civic", mileage: 95000, acv: "9500", payoff: "4200" });
  await db.insert(paymentCalculations).values([
    { dealId: dealA.id, type: "finance", termMonths: 60, apr: "6.90", downPayment: "3000", monthlyPayment: String(q(ravPrice, "finance", 3000, 60, 6.9, 5300).monthlyPayment), scenarioLabel: "60mo @ 6.9%" },
    { dealId: dealA.id, type: "finance", termMonths: 72, apr: "6.90", downPayment: "3000", monthlyPayment: String(aQuote.monthlyPayment), scenarioLabel: "72mo @ 6.9%" },
  ]);

  // === Deal B — Dan Pruitt / CX-5 — status: credit_submitted (lease) =======
  const cxPrice = 33900;
  const bQuote = q(cxPrice, "lease", 2500, 36, 5.5);
  const [dealB] = await db
    .insert(deals)
    .values({
      customerId: cu("Dan"), vehicleId: vstock("M9013"), salespersonId: sp("Sam Okafor"),
      type: "lease", status: "credit_submitted", downPayment: "2500", termMonths: 36, apr: "5.50",
      monthlyPayment: String(bQuote.monthlyPayment), frontGross: "1810", backGross: "650",
    })
    .returning();
  await db.insert(dealProducts).values({ dealId: dealB.id, productId: pr("GAP Protection"), soldPrice: "895" });
  const [bApp] = await db
    .insert(creditApps)
    .values({ customerId: cu("Dan"), dealId: dealB.id, status: "submitted", ssnLast4: "4417", annualIncome: "54000", submittedAt: new Date() })
    .returning();
  await db.insert(lenderSubmissions).values({ creditAppId: bApp.id, lenderId: le("Captive Lease Co") });

  // === Deal C — Aaron Cheng / CR-V — status: ready (decisioned + approved) ==
  const crvPrice = 29450;
  const cQuote = q(crvPrice, "finance", 5000, 60, 6.4);
  const [dealC] = await db
    .insert(deals)
    .values({
      customerId: cu("Aaron"), vehicleId: vstock("H5520"), salespersonId: sp("Priya Nair"),
      type: "finance", status: "ready", downPayment: "5000", termMonths: 60, apr: "6.40",
      monthlyPayment: String(cQuote.monthlyPayment), frontGross: "2400", backGross: "1200",
    })
    .returning();
  await db.insert(dealProducts).values([
    { dealId: dealC.id, productId: pr("Vehicle Service Contract (72mo)"), soldPrice: "2495" },
    { dealId: dealC.id, productId: pr("Tire & Wheel Protection"), soldPrice: "799" },
  ]);
  const [cApp] = await db
    .insert(creditApps)
    .values({ customerId: cu("Aaron"), dealId: dealC.id, status: "decisioned", ssnLast4: "8830", annualIncome: "110000", submittedAt: new Date() })
    .returning();
  const [cSub] = await db.insert(lenderSubmissions).values({ creditAppId: cApp.id, lenderId: le("Prime Bank") }).returning();
  await db.insert(loanDecisions).values({ lenderSubmissionId: cSub.id, status: "approved", approvedRate: "6.40", approvedTermMonths: 60, maxAmount: "32000", stipulations: "Proof of income" });

  // === Deal D — Nina Patel / Model 3 — status: quoted (just a desk) ========
  const teslaPrice = 39900;
  const dQuote = q(teslaPrice, "finance", 4000, 72, 5.9);
  const [dealD] = await db
    .insert(deals)
    .values({
      customerId: cu("Nina"), vehicleId: vstock("E8842"), salespersonId: sp("Jordan Reyes"),
      type: "finance", status: "quoted", downPayment: "4000", termMonths: 72, apr: "5.90",
      monthlyPayment: String(dQuote.monthlyPayment), frontGross: "2700", backGross: "0",
    })
    .returning();
  await db.insert(paymentCalculations).values({ dealId: dealD.id, type: "finance", termMonths: 72, apr: "5.90", downPayment: "4000", monthlyPayment: String(dQuote.monthlyPayment), scenarioLabel: "72mo @ 5.9%" });

  // === Deal E — Marcus Webb (+co-buyer) / Telluride — lender_decision ======
  const telPrice = 46900;
  const eQuote = q(telPrice, "finance", 6000, 72, 7.4);
  const [dealE] = await db
    .insert(deals)
    .values({
      customerId: cu("Marcus"), vehicleId: vstock("K7724"), salespersonId: sp("Chris Bell"),
      type: "finance", status: "lender_decision", downPayment: "6000", termMonths: 72, apr: "7.40",
      monthlyPayment: String(eQuote.monthlyPayment), frontGross: "3000", backGross: "1794",
    })
    .returning();
  await db.insert(dealProducts).values([
    { dealId: dealE.id, productId: pr("Extended Warranty (100k)"), soldPrice: "2995" },
    { dealId: dealE.id, productId: pr("GAP Plus"), soldPrice: "1095" },
  ]);
  const [eApp] = await db
    .insert(creditApps)
    .values({ customerId: cu("Marcus"), dealId: dealE.id, status: "decisioned", ssnLast4: "2261", annualIncome: "92000", submittedAt: new Date() })
    .returning();
  const [eSub1] = await db.insert(lenderSubmissions).values({ creditAppId: eApp.id, lenderId: le("Prime Bank") }).returning();
  const [eSub2] = await db.insert(lenderSubmissions).values({ creditAppId: eApp.id, lenderId: le("Capital Credit Union") }).returning();
  await db.insert(loanDecisions).values([
    { lenderSubmissionId: eSub1.id, status: "conditional", approvedRate: "7.40", approvedTermMonths: 72, maxAmount: "45000", stipulations: "Larger down payment required" },
    { lenderSubmissionId: eSub2.id, status: "approved", approvedRate: "7.90", approvedTermMonths: 72, maxAmount: "48000" },
  ]);

  console.log("Seed complete:");
  console.log(`  ${staff.length} staff, ${veh.length} vehicles, ${cust.length} customers, ${lend.length} lenders, ${prod.length} products`);
  console.log(`  5 deals across lifecycle: deal=${dealA.id}, credit_submitted=${dealB.id}, ready=${dealC.id}, quoted=${dealD.id}, lender_decision=${dealE.id}`);
}

// tiny local eq helper to avoid importing drizzle operators at top for one use
import { eq } from "drizzle-orm";
function eqId(col: Parameters<typeof eq>[0], val: number) {
  return eq(col, val);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
