// Engångsskript: ta bort alla Statistikern-inlägg som innehåller "Lag 1" eller "Lag 2"
import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const snap = await db.collection("chat").where("user", "==", "🤖 Statistikern").get();

const batch = db.batch();
let count = 0;

snap.forEach(doc => {
  const text = doc.data().text || "";
  if (text.includes("Lag 1") || text.includes("Lag 2")) {
    batch.delete(doc.ref);
    count++;
    console.log(`Tar bort: ${doc.id}`);
  }
});

if (count > 0) {
  await batch.commit();
  console.log(`✅ Raderade ${count} dåliga inlägg.`);
} else {
  console.log("Inga inlägg att ta bort.");
}
process.exit(0);
