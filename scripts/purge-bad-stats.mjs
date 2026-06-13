// Engångsskript: ta bort ALLA inlägg från Statistikern
// (för att rensa gamla felaktiga/duplicerade inlägg)
import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const snap = await db.collection("chat").where("user", "==", "🤖 Statistikern").get();

if (snap.empty) {
  console.log("Inga Statistikern-inlägg att ta bort.");
  process.exit(0);
}

const batch = db.batch();
snap.forEach(doc => {
  batch.delete(doc.ref);
  console.log(`Tar bort: ${doc.id}`);
});

await batch.commit();
console.log(`✅ Raderade ${snap.size} Statistikern-inlägg.`);
process.exit(0);
