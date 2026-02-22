/**
 * Builds app data for display.
 * - If bank (Plaid) is connected: display only sandbox JSON data.
 * - If bank not connected: display user's DB data (transactions, balance, subscriptions).
 *   When DB is empty, show sandbox JSON as fallback.
 */

const supabaseAdmin = require('../supabaseAdmin');
const plaidClient = require('./plaid-client');
const { getSandboxData } = require('./sandbox-data');
const { getTaxConfig } = require('./tax-config');

function normalisePlaidTransaction(tx) {
  return {
    id: tx.transaction_id,
    type: tx.amount > 0 ? 'expense' : 'income',
    amount: Math.abs(tx.amount),
    merchant: tx.merchant_name || tx.name,
    category:
      tx.personal_finance_category?.primary ||
      (tx.category && tx.category[0]) ||
      'Other',
    date: tx.date,
  };
}

async function fetchPlaidTransactions(accessToken) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 90);
  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: startDate.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0],
  });
  return response.data.transactions.map(normalisePlaidTransaction);
}


async function getPlaidAccessToken(userId) {
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('plaid_access_token')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.plaid_access_token ?? null;
}

async function getTransactions(userType, userId = null) {
  if (!userId) {
    const sandbox = getSandboxData(userType);
    return { transactions: sandbox.transactions };
  }
  const accessToken = await getPlaidAccessToken(userId);
  if (accessToken) {
    const transactions = await fetchPlaidTransactions(accessToken);
    return { transactions };
  }
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  const dbTransactions = data ?? [];
  if (dbTransactions.length === 0) {
    const sandbox = getSandboxData(userType);
    return { transactions: sandbox.transactions };
  }
  return { transactions: dbTransactions };
}

async function getBalance(userId, userType = null) {
  if (!userId) {
    if (userType) {
      const sandbox = getSandboxData(userType);
      return typeof sandbox.account?.currentBalance === 'number' ? sandbox.account.currentBalance : 0;
    }
    return null;
  }
  // Plaid doesn't provide balance via transactionsGet — use user_settings, fall back to sandbox
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('current_balance')
    .eq('user_id', userId)
    .maybeSingle();
  if (!error && data != null) return Number(data.current_balance);
  if (userType) {
    const sandbox = getSandboxData(userType);
    return typeof sandbox.account?.currentBalance === 'number' ? sandbox.account.currentBalance : 0;
  }
  return 0;
}

async function getSubscriptions(userId, userType = null) {
  if (!userId) {
    if (userType) {
      const sandbox = getSandboxData(userType);
      return sandbox.subscriptions ?? [];
    }
    return [];
  }
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  const list = (data ?? []).map((s) => ({
    id: s.id,
    merchant: s.merchant,
    amount: Number(s.amount),
    nextDueDate: s.next_due_date,
    frequency: s.frequency,
  }));
  if (list.length === 0 && userType) {
    const sandbox = getSandboxData(userType);
    return sandbox.subscriptions ?? [];
  }
  return list;
}

async function buildAppData(userType, userId = null) {
  const [transactionsRes, subscriptions, currentBalance] = await Promise.all([
    getTransactions(userType, userId),
    getSubscriptions(userId, userType),
    getBalance(userId, userType),
  ]);
  return {
    transactions: transactionsRes.transactions,
    subscriptions,
    currentBalance: currentBalance != null ? currentBalance : 0,
    taxConfig: getTaxConfig(userType),
  };
}

module.exports = {
  getTransactions,
  getBalance,
  getSubscriptions,
  buildAppData,
};
