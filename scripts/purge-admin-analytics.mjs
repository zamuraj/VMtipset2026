/**
 * purge-admin-analytics.mjs
 *
 * Engångsskript — tar bort ALLA dokument med metadata.is_admin == true
 * från Firestore-samlingen app_analytics.
 *
 * Kör med: node scripts/purge-admin-analytics.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- Hitta service-account-nyckeln ----
// Placera din serviceAccountKey.json i projektets rot, eller sätt
// GOOGLE_APPLICATION_CREDENTIALS miljövariabeln.
const keyPath = resolve(__dirname, '../serviceAccountKey.json');

if (!existsSync(keyPath)) {
  console.error(`\n❌ Hittar ingen serviceAccountKey.json på:\n   ${keyPath}\n`);
  console.error(
    'Ladda ner den från Firebase Console → Projektinställningar → Tjänstekonton → Generera ny nyckel\n'
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ---- Radera admin-dokument i batchar om 500 ----
async function purgeAdminAnalytics() {
  const COLLECTION = 'app_analytics';
  const BATCH_SIZE = 500;
  let totalDeleted = 0;

  console.log(`\n🔍 Söker efter admin-events i "${COLLECTION}"...\n`);

  let lastDoc = null;
  let hasMore = true;

  while (hasMore) {
    let query = db
      .collection(COLLECTION)
      .where('metadata.is_admin', '==', true)
      .limit(BATCH_SIZE);

    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    totalDeleted += snapshot.size;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    console.log(`   Raderade ${totalDeleted} dokument hittills...`);

    // Om vi fick färre än BATCH_SIZE är vi klara
    if (snapshot.size < BATCH_SIZE) hasMore = false;
  }

  if (totalDeleted === 0) {
    console.log('✅ Inga admin-events hittades. Firestore är redan ren!\n');
  } else {
    console.log(`\n✅ Klart! Totalt raderade: ${totalDeleted} admin-event(s).\n`);
  }
}

purgeAdminAnalytics().catch((err) => {
  console.error('❌ Fel:', err);
  process.exit(1);
});
