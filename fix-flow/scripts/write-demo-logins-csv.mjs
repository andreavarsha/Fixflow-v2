import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SUPPLIERS = [
  ["Nimal Perera", "Plumbing", "kadana"],
  ["Ranjith Fernando", "Plumbing", "kadana"],
  ["Kamal Silva", "Electrical", "kadana"],
  ["Dinesh Wickrama", "Electrical", "kadana"],
  ["Susantha Bandara", "Roofing", "kadana"],
  ["Rohan Jayawardena", "Carpentry", "kadana"],
  ["Saman Kumarasinghe", "Painting", "kadana"],
  ["Chaminda Senanayake", "Garden / Landscaping", "kadana"],
  ["Selvakumar Nadar", "General Maintenance", "kadana"],
  ["Priya Subramaniam", "Plumbing", "rajagiriya"],
  ["Arjun Selvam", "Electrical", "rajagiriya"],
  ["Mahesh Rathnayake", "Roofing", "rajagiriya"],
  ["Thilak Dissanayake", "Carpentry", "rajagiriya"],
  ["Lalith Weerasinghe", "Painting", "rajagiriya"],
  ["Anura Gunasekara", "Garden / Landscaping", "rajagiriya"],
  ["Ishara Mendis", "General Maintenance", "rajagiriya"],
  ["Farook Ismail", "Plumbing", "rajagiriya"],
  ["Kumaran Pillai", "Roofing", "nawala"],
  ["Muthu Krishnan", "Painting", "nawala"],
  ["Janaka Perera", "Plumbing", "nawala"],
  ["Sandun Fernando", "Electrical", "nawala"],
  ["Gayan Silva", "Carpentry", "nawala"],
  ["Ruwan Bandara", "Garden / Landscaping", "nawala"],
  ["Heshan Jayasuriya", "General Maintenance", "nawala"],
  ["Nadeesha Wijesinghe", "Electrical", "nawala"],
];

function supplierEmail(name, index) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}.${index}@fixflow.lk`;
}

function escapeCsv(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

const rows = [
  ["role", "name", "email", "password", "category", "zone", "notes"],
  [
    "owner",
    "Demo Owner",
    "demo.owner@fixflow.lk",
    "",
    "",
    "",
    "User row via seed:ensureDemoOwner — password not auto-set; use Sign up for owners",
  ],
  [
    "owner",
    "Any homeowner (sign up)",
    "(email you choose)",
    "(password you choose)",
    "",
    "",
    "Public signup is owner-only",
  ],
];

for (let i = 0; i < SUPPLIERS.length; i++) {
  const [name, category, zone] = SUPPLIERS[i];
  rows.push([
    "supplier",
    name,
    supplierEmail(name, i + 1),
    "FixFlowDemo1",
    category,
    zone,
    "After npx convex run demoAuth:setupDemoSupplierPasswords",
  ]);
}

const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "demo-logins.csv");
writeFileSync(outPath, csv);
console.log(`Wrote ${rows.length} rows to ${outPath}`);
