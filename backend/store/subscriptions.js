const smeSeed = require('../data/seed-sme');
const individualSeed = require('../data/seed-individual');

// Two isolated Maps, one per user_type, pre-seeded at module load
const stores = {
  sme:        new Map(smeSeed.seedSubscriptions.map(s => [s.id, { ...s }])),
  individual: new Map(individualSeed.seedSubscriptions.map(s => [s.id, { ...s }])),
};

function getStore(userType) {
  if (!stores[userType]) throw new Error(`Unknown user_type: ${userType}`);
  return stores[userType];
}

function listSubscriptions(userType) {
  return Array.from(getStore(userType).values());
}

function addSubscription(userType, { merchant, amount, nextDueDate, frequency }) {
  const id = `sub-${Date.now()}`;
  const entry = { id, merchant, amount, nextDueDate, frequency };
  getStore(userType).set(id, entry);
  return entry;
}

function deleteSubscription(userType, id) {
  const store = getStore(userType);
  if (!store.has(id)) return false;
  store.delete(id);
  return true;
}

module.exports = { listSubscriptions, addSubscription, deleteSubscription };
