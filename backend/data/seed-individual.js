function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const seedTransactions = [
  // Income - monthly salary
  { id: "i1",  date: "2025-01-25", amount: 3800,  merchant: "Acme Tech Ltd",    type: "income",  category: "Salary" },
  { id: "i2",  date: "2025-02-25", amount: 3800,  merchant: "Acme Tech Ltd",    type: "income",  category: "Salary" },
  { id: "i3",  date: "2025-03-25", amount: 3800,  merchant: "Acme Tech Ltd",    type: "income",  category: "Salary" },

  // Side income (freelance)
  { id: "i4",  date: "2025-02-10", amount: 650,   merchant: "Freelance Client", type: "income",  category: "Freelance" },
  { id: "i5",  date: "2025-03-14", amount: 400,   merchant: "Freelance Client", type: "income",  category: "Freelance" },

  // Rent (recurring monthly)
  { id: "i6",  date: "2025-01-01", amount: 1400,  merchant: "Dublin Rental Co", type: "expense", category: "Rent" },
  { id: "i7",  date: "2025-02-01", amount: 1400,  merchant: "Dublin Rental Co", type: "expense", category: "Rent" },
  { id: "i8",  date: "2025-03-01", amount: 1400,  merchant: "Dublin Rental Co", type: "expense", category: "Rent" },

  // Groceries (bi-weekly, slight variation)
  { id: "i9",  date: "2025-01-07", amount: 180,   merchant: "Tesco",            type: "expense", category: "Groceries" },
  { id: "i10", date: "2025-01-21", amount: 175,   merchant: "Tesco",            type: "expense", category: "Groceries" },
  { id: "i11", date: "2025-02-04", amount: 195,   merchant: "Tesco",            type: "expense", category: "Groceries" },
  { id: "i12", date: "2025-02-18", amount: 170,   merchant: "Tesco",            type: "expense", category: "Groceries" },
  { id: "i13", date: "2025-03-04", amount: 185,   merchant: "Tesco",            type: "expense", category: "Groceries" },
  { id: "i14", date: "2025-03-18", amount: 190,   merchant: "Tesco",            type: "expense", category: "Groceries" },

  // Utilities - electricity (recurring monthly)
  { id: "i15", date: "2025-01-10", amount: 95,    merchant: "Electric Ireland", type: "expense", category: "Utilities" },
  { id: "i16", date: "2025-02-10", amount: 98,    merchant: "Electric Ireland", type: "expense", category: "Utilities" },
  { id: "i17", date: "2025-03-10", amount: 92,    merchant: "Electric Ireland", type: "expense", category: "Utilities" },

  // Utilities - broadband (recurring monthly)
  { id: "i18", date: "2025-01-15", amount: 45,    merchant: "Eir Broadband",   type: "expense", category: "Utilities" },
  { id: "i19", date: "2025-02-15", amount: 45,    merchant: "Eir Broadband",   type: "expense", category: "Utilities" },
  { id: "i20", date: "2025-03-15", amount: 45,    merchant: "Eir Broadband",   type: "expense", category: "Utilities" },

  // Subscriptions - Netflix (recurring monthly)
  { id: "i21", date: "2025-01-05", amount: 17.99, merchant: "Netflix",         type: "expense", category: "Subscriptions" },
  { id: "i22", date: "2025-02-05", amount: 17.99, merchant: "Netflix",         type: "expense", category: "Subscriptions" },
  { id: "i23", date: "2025-03-05", amount: 17.99, merchant: "Netflix",         type: "expense", category: "Subscriptions" },

  // Subscriptions - Spotify (recurring monthly)
  { id: "i24", date: "2025-01-12", amount: 11.99, merchant: "Spotify",         type: "expense", category: "Subscriptions" },
  { id: "i25", date: "2025-02-12", amount: 11.99, merchant: "Spotify",         type: "expense", category: "Subscriptions" },
  { id: "i26", date: "2025-03-12", amount: 11.99, merchant: "Spotify",         type: "expense", category: "Subscriptions" },

  // Subscriptions - Gym (recurring monthly)
  { id: "i27", date: "2025-01-20", amount: 49.99, merchant: "Gym Membership",  type: "expense", category: "Health" },
  { id: "i28", date: "2025-02-20", amount: 49.99, merchant: "Gym Membership",  type: "expense", category: "Health" },
  { id: "i29", date: "2025-03-20", amount: 49.99, merchant: "Gym Membership",  type: "expense", category: "Health" },

  // Transport - Leap card top-up (recurring monthly)
  { id: "i30", date: "2025-01-03", amount: 120,   merchant: "Dublin Bus",      type: "expense", category: "Transport" },
  { id: "i31", date: "2025-02-03", amount: 120,   merchant: "Dublin Bus",      type: "expense", category: "Transport" },
  { id: "i32", date: "2025-03-03", amount: 120,   merchant: "Dublin Bus",      type: "expense", category: "Transport" },

  // Dining / Entertainment (irregular)
  { id: "i33", date: "2025-01-18", amount: 65,    merchant: "Wagamama",        type: "expense", category: "Dining" },
  { id: "i34", date: "2025-02-14", amount: 89,    merchant: "Nando's",         type: "expense", category: "Dining" },
  { id: "i35", date: "2025-03-08", amount: 54,    merchant: "The Harbour Bar", type: "expense", category: "Dining" },

  // One-off / irregular
  { id: "i36", date: "2025-01-22", amount: 220,   merchant: "Boots",           type: "expense", category: "Healthcare" },
  { id: "i37", date: "2025-02-28", amount: 149,   merchant: "Penneys",         type: "expense", category: "Clothing" },
  { id: "i38", date: "2025-03-16", amount: 55,    merchant: "Eason",           type: "expense", category: "Education" },
  { id: "i39", date: "2025-03-24", amount: 340,   merchant: "Ryanair",         type: "expense", category: "Travel" },
  { id: "i40", date: "2025-02-08", amount: 85,    merchant: "Pharmacist",      type: "expense", category: "Healthcare" },
];

const currentBalance = 8750;

const taxConfig = {
  type: 'individual',
  vatRate: null,
  corpTaxRate: null,
  prsiRate: 0.04,
  incomeTaxRate: 0.20,
  uscRate: 0.04,
};

const seedSubscriptions = [
  { id: 'sub-1', merchant: 'Netflix',        amount: 17.99, nextDueDate: daysFromNow(12), frequency: 'monthly' },
  { id: 'sub-2', merchant: 'Gym Membership', amount: 49.99, nextDueDate: daysFromNow(27), frequency: 'monthly' },
  { id: 'sub-3', merchant: 'Dublin Bus',     amount: 120,   nextDueDate: daysFromNow(10), frequency: 'monthly' },
];

module.exports = { seedTransactions, currentBalance, taxConfig, seedSubscriptions };
