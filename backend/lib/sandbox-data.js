/**
 * Loads customizable sandbox test data from JSON files.
 * Used when a user has no bank connected and no stored transactions (sandbox/demo mode).
 */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SANDBOX_FILES = {
  individual: path.join(DATA_DIR, 'sandbox-individual.json'),
  sme: path.join(DATA_DIR, 'sandbox-sme.json'),
};

let cache = { individual: null, sme: null };

function loadSandbox(userType) {
  if (!['individual', 'sme'].includes(userType)) {
    throw new Error(`Invalid user_type: ${userType}. Must be "individual" or "sme".`);
  }
  if (cache[userType]) return cache[userType];
  const filePath = SANDBOX_FILES[userType];
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!data.account || !Array.isArray(data.transactions)) {
      throw new Error(`Invalid sandbox JSON: account and transactions required in ${filePath}`);
    }
    cache[userType] = {
      account: data.account,
      transactions: data.transactions,
      subscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : [],
    };
    return cache[userType];
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Sandbox data file not found: ${filePath}. Add data/sandbox-${userType}.json to customize test data.`);
    }
    throw err;
  }
}

/** Returns full sandbox data for a user type */
function getSandboxData(userType) {
  return loadSandbox(userType);
}

/** Returns transaction history from sandbox JSON */
function getSandboxTransactions(userType) {
  return loadSandbox(userType).transactions;
}

/** Returns account info (currentBalance, displayName) from sandbox JSON */
function getSandboxAccount(userType) {
  return loadSandbox(userType).account;
}

/** Returns manual subscriptions from sandbox JSON */
function getSandboxSubscriptions(userType) {
  return loadSandbox(userType).subscriptions;
}

/**
 * Used by CFO route: returns { currentBalance } for the given user type.
 * Enables sandbox balance when using sandbox transaction data.
 */
function getSeedMeta(userType) {
  const account = getSandboxAccount(userType);
  return {
    currentBalance: typeof account.currentBalance === 'number' ? account.currentBalance : 0,
  };
}

/** Clear in-memory cache (e.g. for tests or hot-reload of JSON) */
function clearSandboxCache() {
  cache = { individual: null, sme: null };
}

module.exports = {
  getSandboxData,
  getSandboxTransactions,
  getSandboxAccount,
  getSandboxSubscriptions,
  getSeedMeta,
  clearSandboxCache,
};
