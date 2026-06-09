/**
 * check-login-failures.mjs
 *
 * Hämtar och visar alla login_failed-events från Firestore de senaste 7 dagarna.
 * Grupperar per anledning (reason) och visar de senaste e-postförsöken om sådana finns.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  // Hämta utan compound-query (undviker index-krav)
  const snap = await db.collection('app_analytics')
    .orderBy('timestamp', 'desc')
    .limit(2000)
    .get();

  const events = snap.docs
    .map(d => d.data())
    .filter(e => e.event_name === 'login_failed' && new Date(e.timestamp) >= since);

  console.log(`\n🔍 Totalt ${events.length} misslyckade inloggningar de senaste 7 dagarna:\n`);

  const byReason = {};
  events.forEach(e => {
    const reason = e.metadata?.reason || 'okänd';
    const isAdmin = e.metadata?.is_admin;
    byReason[reason] = byReason[reason] || [];
    byReason[reason].push({
      timestamp: e.timestamp,
      session_id: e.session_id,
      is_admin: isAdmin,
    });
  });

  for (const [reason, list] of Object.entries(byReason)) {
    const reasonLabel = {
      email_not_found: '❓ E-post ej hittad',
      wrong_password: '🔑 Fel lösenord',
      awaiting_approval: '⏳ Väntar på godkännande',
    }[reason] || reason;

    console.log(`${reasonLabel}: ${list.length} st`);
    list.slice(0, 5).forEach(e => {
      const adminFlag = e.is_admin ? ' [ADMIN]' : '';
      console.log(`   ${e.timestamp}  session: ${e.session_id?.slice(0, 8)}...${adminFlag}`);
    });
    console.log('');
  }
}

run().catch(e => { console.error('❌', e); process.exit(1); });
