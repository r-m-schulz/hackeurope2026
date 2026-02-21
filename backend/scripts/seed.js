require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabaseAdmin = require('../supabaseAdmin');
const smeSeed = require('../data/seed-sme');
const indSeed = require('../data/seed-individual');

async function seed() {
  const smeRows = smeSeed.seedTransactions.map(t => ({ ...t, user_type: 'sme' }));
  const indRows = indSeed.seedTransactions.map(t => ({ ...t, user_type: 'individual' }));
  const allRows = [...smeRows, ...indRows];

  console.log(`Seeding ${allRows.length} transactions...`);

  const { error } = await supabaseAdmin
    .from('transactions')
    .upsert(allRows, { onConflict: 'id' });

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Done. ${smeRows.length} SME + ${indRows.length} individual transactions inserted.`);
  process.exit(0);
}

seed();
