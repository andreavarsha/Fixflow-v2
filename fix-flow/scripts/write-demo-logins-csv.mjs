import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** Keep in sync with convex/seed.ts — 5 per category across 3 towns (2/2/1). */
const CATEGORIES = [
  [
    "Plumbing",
    [
      ["Nimal Perera", "kadana"],
      ["Ranjith Fernando", "kadana"],
      ["Priya Subramaniam", "rajagiriya"],
      ["Farook Ismail", "rajagiriya"],
      ["Janaka Perera", "nawala"],
    ],
  ],
  [
    "Electrical",
    [
      ["Kamal Silva", "kadana"],
      ["Dinesh Wickrama", "kadana"],
      ["Arjun Selvam", "rajagiriya"],
      ["Sandun Fernando", "rajagiriya"],
      ["Nadeesha Wijesinghe", "nawala"],
    ],
  ],
  [
    "Roofing",
    [
      ["Susantha Bandara", "kadana"],
      ["Asanka Peiris", "kadana"],
      ["Mahesh Rathnayake", "rajagiriya"],
      ["Nuwan Herath", "rajagiriya"],
      ["Kumaran Pillai", "nawala"],
    ],
  ],
  [
    "Carpentry",
    [
      ["Rohan Jayawardena", "kadana"],
      ["Kasun Amarasinghe", "kadana"],
      ["Thilak Dissanayake", "rajagiriya"],
      ["Pradeep Fonseka", "rajagiriya"],
      ["Gayan Silva", "nawala"],
    ],
  ],
  [
    "Painting",
    [
      ["Saman Kumarasinghe", "kadana"],
      ["Buddika Pathirana", "kadana"],
      ["Lalith Weerasinghe", "rajagiriya"],
      ["Chathura Ekanayake", "rajagiriya"],
      ["Muthu Krishnan", "nawala"],
    ],
  ],
  [
    "Garden / Landscaping",
    [
      ["Chaminda Senanayake", "kadana"],
      ["Lahiru Abeysekara", "kadana"],
      ["Anura Gunasekara", "rajagiriya"],
      ["Dilshan Karunaratne", "rajagiriya"],
      ["Ruwan Bandara", "nawala"],
    ],
  ],
  [
    "General Maintenance",
    [
      ["Selvakumar Nadar", "kadana"],
      ["Amila Ratnayake", "kadana"],
      ["Ishara Mendis", "rajagiriya"],
      ["Tharindu Jayasinghe", "rajagiriya"],
      ["Heshan Jayasuriya", "nawala"],
    ],
  ],
];

const SUPPLIERS = CATEGORIES.flatMap(([category, people]) =>
  people.map(([name, zone]) => [name, category, zone]),
);

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
console.log(`Wrote ${SUPPLIERS.length} suppliers (${rows.length} rows) to ${outPath}`);
