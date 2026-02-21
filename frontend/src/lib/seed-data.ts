import { Transaction } from "./types";

export const seedTransactions: Transaction[] = [
  // Revenue / Income
  { id: "t1", date: "2025-01-03", amount: 12500, merchant: "Acme Corp", type: "income", category: "Revenue" },
  { id: "t2", date: "2025-01-10", amount: 8400, merchant: "BrightWave Ltd", type: "income", category: "Revenue" },
  { id: "t3", date: "2025-01-18", amount: 4200, merchant: "Freelance Client A", type: "income", category: "Revenue" },
  { id: "t4", date: "2025-02-03", amount: 12500, merchant: "Acme Corp", type: "income", category: "Revenue" },
  { id: "t5", date: "2025-02-11", amount: 8600, merchant: "BrightWave Ltd", type: "income", category: "Revenue" },
  { id: "t6", date: "2025-02-20", amount: 3100, merchant: "Freelance Client B", type: "income", category: "Revenue" },
  { id: "t7", date: "2025-03-03", amount: 12500, merchant: "Acme Corp", type: "income", category: "Revenue" },
  { id: "t8", date: "2025-03-12", amount: 8500, merchant: "BrightWave Ltd", type: "income", category: "Revenue" },

  // Payroll (recurring)
  { id: "t9", date: "2025-01-28", amount: 6500, merchant: "Payroll - Staff", type: "expense", category: "Payroll" },
  { id: "t10", date: "2025-02-28", amount: 6500, merchant: "Payroll - Staff", type: "expense", category: "Payroll" },
  { id: "t11", date: "2025-03-28", amount: 6600, merchant: "Payroll - Staff", type: "expense", category: "Payroll" },

  // Subscriptions (recurring)
  { id: "t12", date: "2025-01-01", amount: 299, merchant: "AWS", type: "expense", category: "Subscriptions" },
  { id: "t13", date: "2025-02-01", amount: 305, merchant: "AWS", type: "expense", category: "Subscriptions" },
  { id: "t14", date: "2025-03-01", amount: 298, merchant: "AWS", type: "expense", category: "Subscriptions" },

  { id: "t15", date: "2025-01-05", amount: 49, merchant: "Slack", type: "expense", category: "Subscriptions" },
  { id: "t16", date: "2025-02-05", amount: 49, merchant: "Slack", type: "expense", category: "Subscriptions" },
  { id: "t17", date: "2025-03-05", amount: 49, merchant: "Slack", type: "expense", category: "Subscriptions" },

  { id: "t18", date: "2025-01-15", amount: 120, merchant: "HubSpot", type: "expense", category: "Subscriptions" },
  { id: "t19", date: "2025-02-15", amount: 120, merchant: "HubSpot", type: "expense", category: "Subscriptions" },
  { id: "t20", date: "2025-03-15", amount: 120, merchant: "HubSpot", type: "expense", category: "Subscriptions" },

  { id: "t21", date: "2025-01-10", amount: 79, merchant: "Figma", type: "expense", category: "Subscriptions" },
  { id: "t22", date: "2025-02-10", amount: 79, merchant: "Figma", type: "expense", category: "Subscriptions" },
  { id: "t23", date: "2025-03-10", amount: 79, merchant: "Figma", type: "expense", category: "Subscriptions" },

  // Suppliers
  { id: "t24", date: "2025-01-08", amount: 1200, merchant: "Office Supplies Co", type: "expense", category: "Suppliers" },
  { id: "t25", date: "2025-02-12", amount: 850, merchant: "Office Supplies Co", type: "expense", category: "Suppliers" },
  { id: "t26", date: "2025-03-06", amount: 1100, merchant: "Office Supplies Co", type: "expense", category: "Suppliers" },

  // Rent (recurring)
  { id: "t27", date: "2025-01-01", amount: 2800, merchant: "Dublin Office Lease", type: "expense", category: "Rent" },
  { id: "t28", date: "2025-02-01", amount: 2800, merchant: "Dublin Office Lease", type: "expense", category: "Rent" },
  { id: "t29", date: "2025-03-01", amount: 2800, merchant: "Dublin Office Lease", type: "expense", category: "Rent" },

  // Misc expenses
  { id: "t30", date: "2025-01-20", amount: 340, merchant: "Travel Expenses", type: "expense", category: "Travel" },
  { id: "t31", date: "2025-02-18", amount: 520, merchant: "Travel Expenses", type: "expense", category: "Travel" },
  { id: "t32", date: "2025-03-22", amount: 180, merchant: "Client Lunch", type: "expense", category: "Entertainment" },
  { id: "t33", date: "2025-01-25", amount: 150, merchant: "Client Dinner", type: "expense", category: "Entertainment" },
  { id: "t34", date: "2025-02-22", amount: 95, merchant: "Printer Ink", type: "expense", category: "Supplies" },
  { id: "t35", date: "2025-03-18", amount: 450, merchant: "Marketing Agency", type: "expense", category: "Marketing" },
  { id: "t36", date: "2025-01-30", amount: 750, merchant: "Legal Consult", type: "expense", category: "Legal" },
  { id: "t37", date: "2025-02-25", amount: 200, merchant: "Domain Renewals", type: "expense", category: "IT" },
  { id: "t38", date: "2025-03-20", amount: 330, merchant: "Insurance Premium", type: "expense", category: "Insurance" },
  { id: "t39", date: "2025-03-25", amount: 1200, merchant: "Contractor Payment", type: "expense", category: "Contractors" },
  { id: "t40", date: "2025-03-08", amount: 65, merchant: "Google Workspace", type: "expense", category: "Subscriptions" },
  { id: "t41", date: "2025-02-08", amount: 65, merchant: "Google Workspace", type: "expense", category: "Subscriptions" },
  { id: "t42", date: "2025-01-08", amount: 65, merchant: "Google Workspace", type: "expense", category: "Subscriptions" },

  // Tax payments
  { id: "t43", date: "2025-01-15", amount: 3200, merchant: "Revenue Commissioners", type: "expense", category: "Tax" },
  { id: "t44", date: "2025-03-15", amount: 2800, merchant: "Revenue Commissioners", type: "expense", category: "Tax" },
];
