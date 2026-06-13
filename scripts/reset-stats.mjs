// Engångsskript: nollställ statsPosted på alla avslutade matcher
// så att Statistikern kan regenerera inläggen med korrekt lagnamn och tips.
import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const snap = await db.collection("matches").get();
let count = 0;
const batch = db.batch();

snap.forEach(doc => {
  const d = doc.data();
  if (d.status === "finished" && d.statsPosted) {
    batch.update(doc.ref, { statsPosted: false, statsChatId: null, statsGoals1: null, statsGoals2: null });
    count++;
    console.log(`Nollställer match ${doc.id}: ${d.team1 || '?'} - ${d.team2 || '?'}`);
  }
});

await batch.commit();
console.log(`Klart! Nollställde ${count} matcher.`);
process.exit(0);
