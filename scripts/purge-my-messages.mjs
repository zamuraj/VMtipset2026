// Tar bort Emils testmeddelanden från de senaste 10 minuterna
import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

const snap = await db.collection("chat")
  .where("user", "==", "Emil Zettergren")
  .get();

const batch = db.batch();
let deleted = 0;

snap.forEach(doc => {
  const createdAt = doc.data().createdAt?.toDate?.();
  if (createdAt && createdAt > tenMinutesAgo) {
    batch.delete(doc.ref);
    deleted++;
    console.log(`🗑️ Tar bort: "${doc.data().text?.substring(0, 60)}"`);
  }
});

if (deleted > 0) {
  await batch.commit();
  console.log(`\nKlart! Raderade ${deleted} testmeddelanden.`);
} else {
  console.log("Inga meddelanden hittades inom 10 min.");
}
process.exit(0);
