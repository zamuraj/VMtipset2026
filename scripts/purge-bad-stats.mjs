// Rensar bara Statistikern-inlägg som är tekniska fel eller saknar riktig statistik
// Sparar inlägg som verkar korrekta (har matchfakta-emojis)
import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const snap = await db.collection("chat").where("user", "==", "🤖 Statistikern").get();

const batch = db.batch();
let deleted = 0;
let kept = 0;

snap.forEach(doc => {
  const text = doc.data().text || "";
  const isBad =
    text.includes("Tekniskt fel") ||
    text.includes("tekniskt fel") ||
    text.includes("slipper mitt hån") ||
    text.includes("Lag 1") ||
    text.includes("Lag 2");

  if (isBad) {
    batch.delete(doc.ref);
    deleted++;
    console.log(`🗑️ Tar bort: ${doc.id} - "${text.substring(0, 60)}..."`);
  } else {
    kept++;
    console.log(`✅ Behåller: ${doc.id} - "${text.substring(0, 60)}..."`);
  }
});

if (deleted > 0) {
  await batch.commit();
}
console.log(`\nKlart! Raderade ${deleted} dåliga inlägg, behöll ${kept} bra inlägg.`);

// Nollställ statsPosted BARA för de matcher vars inlägg togs bort
// (undviker att regenerera redan bra inlägg)
const matchesSnap = await db.collection("matches").get();
const resetBatch = db.batch();
let resetCount = 0;

// Hämta kvar-levande statistikern-inlägg
const remainingSnap = await db.collection("chat").where("user", "==", "🤖 Statistikern").get();
const remainingIds = new Set(remainingSnap.docs.map(d => d.id));

matchesSnap.forEach(doc => {
  const d = doc.data();
  if (d.status === "finished" && d.statsPosted && d.statsChatId) {
    if (!remainingIds.has(d.statsChatId)) {
      // Inlägget är borttaget - nollställ flaggan
      resetBatch.update(doc.ref, {
        statsPosted: false,
        statsChatId: null,
        statsGoals1: null,
        statsGoals2: null
      });
      resetCount++;
      console.log(`🔄 Nollställer match ${doc.id}`);
    }
  }
});

if (resetCount > 0) {
  await resetBatch.commit();
}
console.log(`Nollställde ${resetCount} matcher för regenerering.`);
process.exit(0);
