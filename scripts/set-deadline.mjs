import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

// Midnatt svensk tid (CEST = UTC+2) = 2026-06-11T00:00:00+02:00
const midnight = new Date('2026-06-11T00:00:00+02:00');

await db.collection('settings').doc('appConfig').set(
  { deadline: Timestamp.fromDate(midnight) },
  { merge: true }
);

console.log('✅ Deadline satt till:', midnight.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }));
process.exit(0);
