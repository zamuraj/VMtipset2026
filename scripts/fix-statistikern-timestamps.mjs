// Uppdaterar createdAt på befintliga Statistikern-poster till matchstart + 2h
import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Svenska lokal-tider (CEST = UTC+2) för varje match-ID
const MATCH_START_TIMES = {
  1:  "2026-06-11T21:00:00", 3:  "2026-06-12T04:00:00", 2:  "2026-06-12T21:00:00",
  4:  "2026-06-13T03:00:00", 5:  "2026-06-13T21:00:00", 6:  "2026-06-14T00:00:00",
  7:  "2026-06-14T03:00:00", 8:  "2026-06-14T06:00:00", 9:  "2026-06-14T19:00:00",
  10: "2026-06-14T22:00:00", 11: "2026-06-15T01:00:00", 12: "2026-06-15T04:00:00",
  13: "2026-06-15T18:00:00", 14: "2026-06-15T21:00:00", 15: "2026-06-16T00:00:00",
  16: "2026-06-16T03:00:00", 17: "2026-06-16T21:00:00", 18: "2026-06-17T00:00:00",
  19: "2026-06-17T03:00:00", 20: "2026-06-17T06:00:00", 21: "2026-06-17T19:00:00",
  22: "2026-06-17T22:00:00", 23: "2026-06-18T01:00:00", 24: "2026-06-18T04:00:00",
  25: "2026-06-18T18:00:00", 26: "2026-06-18T21:00:00", 27: "2026-06-19T00:00:00",
  28: "2026-06-19T03:00:00", 29: "2026-06-19T21:00:00", 30: "2026-06-20T00:00:00",
};

function getMatchPostTimestamp(matchId) {
  const localStr = MATCH_START_TIMES[parseInt(matchId)];
  if (!localStr) return null;
  const startLocal = new Date(localStr + '+02:00');
  return new Date(startLocal.getTime() + 2 * 60 * 60 * 1000);
}

// Hämta alla matcher för att hitta statsChatId → match-ID-mappning
const matchesSnap = await db.collection("matches").get();
const chatIdToMatchId = {};
matchesSnap.forEach(doc => {
  const d = doc.data();
  if (d.statsChatId) {
    chatIdToMatchId[d.statsChatId] = parseInt(doc.id);
  }
});

console.log(`Hittade ${Object.keys(chatIdToMatchId).length} Statistikern-poster att uppdatera.`);

const batch = db.batch();
let updated = 0;

for (const [chatId, matchId] of Object.entries(chatIdToMatchId)) {
  const postTime = getMatchPostTimestamp(matchId);
  if (!postTime) {
    console.log(`⚠️  Ingen tid hittad för match ${matchId}, hoppar över.`);
    continue;
  }
  const chatRef = db.collection("chat").doc(chatId);
  batch.update(chatRef, {
    createdAt: admin.firestore.Timestamp.fromDate(postTime)
  });
  console.log(`✅ Match ${matchId} (${chatId}): → ${postTime.toISOString()}`);
  updated++;
}

if (updated > 0) {
  await batch.commit();
  console.log(`\nKlart! Uppdaterade tidsstämplar på ${updated} poster.`);
} else {
  console.log("Inga poster uppdaterades.");
}
process.exit(0);
