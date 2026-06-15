// Tar bort ALLA Statistikern-poster och nollställer alla statsPosted-flaggor.
// Används i reset-workflodet för att starta om från noll.
import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

console.log("=== FULL RENSNING AV STATISTIKERN-POSTER ===");

// 1. Radera alla Statistikern-chattinlägg
const chatSnap = await db.collection("chat").where("user", "==", "🤖 Statistikern").get();
const chatBatch = db.batch();
chatSnap.forEach(doc => {
  chatBatch.delete(doc.ref);
  console.log(`🗑️ Raderar: ${doc.id} – "${doc.data().text?.substring(0, 50)}..."`);
});
if (!chatSnap.empty) {
  await chatBatch.commit();
}
console.log(`Raderade ${chatSnap.size} Statistikern-poster från chatten.`);

// 2. Nollställ statsPosted på alla avslutade matcher
const matchesSnap = await db.collection("matches").get();
const matchBatch = db.batch();
let resetCount = 0;
matchesSnap.forEach(doc => {
  const d = doc.data();
  if (d.statsPosted || d.statsChatId) {
    matchBatch.update(doc.ref, {
      statsPosted: false,
      statsChatId: null,
      statsGoals1: null,
      statsGoals2: null
    });
    resetCount++;
  }
});
if (resetCount > 0) {
  await matchBatch.commit();
}
console.log(`Nollställde ${resetCount} matcher.`);
console.log("Klar! Nu kan Statistikern regenerera alla poster.");
process.exit(0);
