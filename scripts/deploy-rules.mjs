/**
 * deploy-rules.mjs
 *
 * Skript för att publicera Firestore-säkerhetsregler direkt via Firebase Admin SDK.
 *
 * Kör med: node scripts/deploy-rules.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const keyPath = resolve(__dirname, '../serviceAccountKey.json');
const rulesPath = resolve(__dirname, '../firestore.rules');

if (!existsSync(keyPath)) {
  console.error(`\n❌ Hittar ingen serviceAccountKey.json på:\n   ${keyPath}\n`);
  process.exit(1);
}

if (!existsSync(rulesPath)) {
  console.error(`\n❌ Hittar ingen firestore.rules på:\n   ${rulesPath}\n`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
const rulesSource = readFileSync(rulesPath, 'utf-8');

console.log('🔄 Initierar Firebase Admin SDK...');
const app = initializeApp({ credential: cert(serviceAccount) });

async function deployRules() {
  console.log('🔄 Publicerar Firestore-säkerhetsregler...');
  const securityRules = getSecurityRules(app);
  
  // releaseFirestoreRulesetFromSource skapar och aktiverar regelfilen
  await securityRules.releaseFirestoreRulesetFromSource(rulesSource);
  
  console.log('\n✅ Firestore-regler har publicerats framgångsrikt!\n');

  console.log('🔄 Hämtar nuvarande aktiva regler för att verifiera...');
  const activeRuleset = await securityRules.getFirestoreRuleset();
  console.log(`Ruleset Name: ${activeRuleset.name}`);
  console.log(`Created Time: ${activeRuleset.createTime}`);
  console.log('\n--- Aktiva Regler ---');
  console.log(activeRuleset.source[0].content);
  console.log('---------------------');
}

deployRules().catch((err) => {
  console.error('\n❌ Fel vid publicering av regler:\n', err);
  process.exit(1);
});
