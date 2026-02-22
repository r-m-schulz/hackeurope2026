/**
 * Seed subscriptions for SME (business) sandbox.
 * Loaded from data/sandbox-sme.json so you can customize test data in one place.
 */
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'sandbox-sme.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

module.exports = {
  seedSubscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : [],
};
