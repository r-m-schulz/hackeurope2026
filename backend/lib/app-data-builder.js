/**
 * Builds app data for display. Only data from sandbox JSON files is shown.
 * Existing DB or Plaid data is ignored so the app always displays the JSON content.
 */

const { getSandboxData } = require('./sandbox-data');
const { getTaxConfig } = require('./tax-config');

function getTransactions(userType) {
  const sandbox = getSandboxData(userType);
  return { transactions: sandbox.transactions };
}

function getBalance(userType) {
  const sandbox = getSandboxData(userType);
  const balance = sandbox.account?.currentBalance;
  return typeof balance === 'number' ? balance : 0;
}

function getSubscriptions(userType) {
  const sandbox = getSandboxData(userType);
  return sandbox.subscriptions ?? [];
}

async function buildAppData(userType, _userId = null) {
  const sandbox = getSandboxData(userType);
  return {
    transactions: sandbox.transactions,
    subscriptions: sandbox.subscriptions ?? [],
    currentBalance: typeof sandbox.account?.currentBalance === 'number' ? sandbox.account.currentBalance : 0,
    taxConfig: getTaxConfig(userType),
  };
}

module.exports = {
  getTransactions,
  getBalance,
  getSubscriptions,
  buildAppData,
};
