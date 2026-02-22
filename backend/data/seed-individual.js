/**
 * Seed subscriptions for individual (personal) sandbox.
 * Loaded from data/sandbox-individual.json so you can customize test data in one place.
 */
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'sandbox-individual.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

module.exports = {
  seedSubscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : [],
};
