import 'dotenv/config';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- INIT FIREBASE ---
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error("Saknar miljövariabel FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// --- INIT GEMINI ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Saknar miljövariabel GEMINI_API_KEY.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools: [{ googleSearch: {} }]
});

// Uppslagsregister: match-ID → starttid (svensk lokal tid)
// Används för att ge chattposter rätt tidsstämpel (matchstart + 2h)
const MATCH_START_TIMES = {
  1:  "2026-06-11T21:00:00",
  3:  "2026-06-12T04:00:00",
  2:  "2026-06-12T21:00:00",
  4:  "2026-06-13T03:00:00",
  5:  "2026-06-13T21:00:00",
  6:  "2026-06-14T00:00:00",
  7:  "2026-06-14T03:00:00",
  8:  "2026-06-14T06:00:00",
  9:  "2026-06-14T19:00:00",
  10: "2026-06-14T22:00:00",
  11: "2026-06-15T01:00:00",
  12: "2026-06-15T04:00:00",
  13: "2026-06-15T18:00:00",
  14: "2026-06-15T21:00:00",
  15: "2026-06-16T00:00:00",
  16: "2026-06-16T03:00:00",
  17: "2026-06-16T21:00:00",
  18: "2026-06-17T00:00:00",
  19: "2026-06-17T03:00:00",
  20: "2026-06-17T06:00:00",
  21: "2026-06-17T19:00:00",
  22: "2026-06-17T22:00:00",
  23: "2026-06-18T01:00:00",
  24: "2026-06-18T04:00:00",
  25: "2026-06-18T18:00:00",
  26: "2026-06-18T21:00:00",
  27: "2026-06-19T00:00:00",
  28: "2026-06-19T03:00:00",
  29: "2026-06-19T21:00:00",
  30: "2026-06-20T00:00:00",
  31: "2026-06-20T02:30:00",
  32: "2026-06-20T05:00:00",
  33: "2026-06-20T19:00:00",
  34: "2026-06-20T22:00:00",
  35: "2026-06-21T02:00:00",
  36: "2026-06-21T06:00:00",
  37: "2026-06-21T18:00:00",
  38: "2026-06-21T21:00:00",
  39: "2026-06-22T00:00:00",
  40: "2026-06-22T03:00:00",
  41: "2026-06-22T19:00:00",
  42: "2026-06-22T23:00:00",
  43: "2026-06-23T02:00:00",
  44: "2026-06-23T05:00:00",
  45: "2026-06-23T19:00:00",
  46: "2026-06-23T22:00:00",
  47: "2026-06-24T01:00:00",
  48: "2026-06-24T04:00:00",
  49: "2026-06-25T03:00:00",
  50: "2026-06-25T03:00:00",
  51: "2026-06-24T21:00:00",
  52: "2026-06-24T21:00:00",
  53: "2026-06-25T00:00:00",
  54: "2026-06-25T00:00:00",
  55: "2026-06-26T04:00:00",
  56: "2026-06-26T04:00:00",
  57: "2026-06-25T22:00:00",
  58: "2026-06-25T22:00:00",
  59: "2026-06-27T00:00:00",
  60: "2026-06-26T01:00:00",
  61: "2026-06-27T05:00:00",
  62: "2026-06-27T05:00:00",
  63: "2026-06-28T00:00:00",
  64: "2026-06-27T02:00:00",
  65: "2026-06-26T21:00:00",
  66: "2026-06-26T21:00:00",
  67: "2026-06-28T04:00:00",
  68: "2026-06-28T04:00:00",
  69: "2026-06-29T18:00:00",
  70: "2026-06-28T01:30:00",
  71: "2026-06-27T23:00:00",
  72: "2026-06-27T23:00:00",
};

// Returnerar ISO-sträng för matchens starttid + 2 timmar (lokal tid → UTC -6h för USA)
// Tiderna i schemat är svenska lokal-tider (CEST = UTC+2)
function getMatchPostTimestamp(matchId) {
  const localStr = MATCH_START_TIMES[parseInt(matchId)];
  if (!localStr) return new Date().toISOString(); // fallback: nu
  // Svensk sommartid = UTC+2, så vi drar bort 2h för att få UTC, sen lägger till 2h för matchslut
  // Netto: starttid + 2h kvar i lokal tid = starttid + 2h + 0h UTC-korrigering = starttid i UTC
  const startLocal = new Date(localStr + '+02:00'); // tolka som CEST
  const postTime = new Date(startLocal.getTime() + 2 * 60 * 60 * 1000); // + 2h för matchslut
  return postTime.toISOString();
}

// Skicka @-notis till omnämnda deltagare
async function sendMentionNotifications(aiText, allTips) {
  const mentionedNames = [];
  const mentionRegex = /@([\wÅÄÖåäö-]+)/g;
  let match;
  while ((match = mentionRegex.exec(aiText)) !== null) {
    mentionedNames.push(match[1].toLowerCase());
  }
  if (mentionedNames.length === 0) return;

  const notifPromises = [];
  allTips.forEach(tipDoc => {
    if (!tipDoc.isApproved || tipDoc.isAdmin) return;
    const firstName = (tipDoc.name || '').split(' ')[0].toLowerCase();
    const fullName = (tipDoc.name || '').toLowerCase();
    if (mentionedNames.some(n => n === firstName || n === fullName.replace(' ', ''))) {
      const notifs = tipDoc.notifications || [];
      notifs.unshift({
        id: Date.now().toString() + Math.random(),
        type: 'mention',
        text: `🤖 Statistikern har nämnt dig i Snackis`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      notifPromises.push(
        db.collection("tips").doc(tipDoc.id).update({ notifications: notifs })
      );
      console.log(`📬 Notis skickad till ${tipDoc.name}`);
    }
  });
  await Promise.all(notifPromises);
}

async function run() {
  console.log(`[${new Date().toISOString()}] Startar Statistikern...`);

  const matchesSnapshot = await db.collection("matches").get();

  let totalTournamentGoals = 0;
  const matchesToProcess = [];

  matchesSnapshot.forEach(doc => {
    const d = doc.data();
    if (d.status === "finished") {
      if (d.goals1 != null && d.goals2 != null) {
        totalTournamentGoals += (d.goals1 + d.goals2);
      }

      const isNew = !d.statsPosted;
      const resultChanged = d.statsPosted && (d.statsGoals1 !== d.goals1 || d.statsGoals2 !== d.goals2);

      if (isNew || resultChanged) {
        matchesToProcess.push({ id: doc.id, isNew, ...d });
      }
    }
  });

  if (matchesToProcess.length === 0) {
    console.log("Inga nya eller uppdaterade matcher att rapportera om.");
    process.exit(0);
  }

  console.log(`Hittade ${matchesToProcess.length} match(er) att rapportera.`);

  const tipsSnapshot = await db.collection("tips").get();
  const allTips = tipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`Hämtade ${allTips.length} tipsdeltagare från databasen.`);

  // Visa en sammanfattning av vad som återstår
  console.log("\n=== ÅTERSTÅENDE MATCHER ===");
  matchesToProcess.forEach((m, i) => {
    const t1 = m.team1 || "?";
    const t2 = m.team2 || "?";
    console.log(`  ${i + 1}. Match ${m.id}: ${t1} ${m.goals1}-${m.goals2} ${t2} (${m.isNew ? "ny" : "uppdaterad"})`);
  });
  const estMinutes = Math.ceil(((matchesToProcess.length - 1) * 35) / 60);
  console.log(`Beräknad tid: ~${estMinutes} min (35s mellanrum)\n`);

  for (let matchIndex = 0; matchIndex < matchesToProcess.length; matchIndex++) {
    const match = matchesToProcess[matchIndex];
    const team1 = match.team1 || "Okänt lag 1";
    const team2 = match.team2 || "Okänt lag 2";
    const g1 = match.goals1;
    const g2 = match.goals2;

    // Vänta mellan matcher för att undvika Gemini rate limits (max 10 req/min)
    if (matchIndex > 0) {
      const delaySeconds = 35;
      console.log(`\n⏳ Väntar ${delaySeconds}s (rate limit-paus)...`);
      await new Promise(r => setTimeout(r, delaySeconds * 1000));
    }

    console.log(`\n[${matchIndex + 1}/${matchesToProcess.length}] ⚽ ${team1} ${g1}-${g2} ${team2} (match-ID: ${match.id})`);

    let correctSign = "X";
    if (g1 > g2) correctSign = "1";
    if (g2 > g1) correctSign = "2";

    // Tips sparas som predictions[matchId] – matchId är ett nummer
    const matchIdNum = parseInt(match.id);
    const userTipsList = [];

    allTips.forEach(tipDoc => {
      if (!tipDoc.isApproved || tipDoc.isAdmin) return;
      const predictions = tipDoc.predictions || {};
      const userSign = predictions[matchIdNum] || predictions[match.id] || predictions[String(matchIdNum)];
      if (userSign) {
        const firstName = (tipDoc.name || tipDoc.id).split(' ')[0];
        userTipsList.push({ name: firstName, sign: userSign, correct: userSign === correctSign });
      }
    });

    console.log(`Hittade ${userTipsList.length} tips för match ${match.id}`);

    const correctTippers = userTipsList.filter(t => t.correct).map(t => `@${t.name}`);
    const wrongTippers = userTipsList.filter(t => !t.correct);
    // Gruppera felaktiga per tecken
    const wrongGroups = {};
    wrongTippers.forEach(t => {
      if (!wrongGroups[t.sign]) wrongGroups[t.sign] = [];
      wrongGroups[t.sign].push(`@${t.name}`);
    });

    // Bygg tipstext – AI:n får en kompakt men informativ bild
    let tipsText = '';
    if (userTipsList.length === 0) {
      tipsText = '(Inga tips registrerade för denna match)';
    } else {
      if (correctTippers.length > 0) {
        tipsText += `Rätt (${correctSign}): ${correctTippers.join(', ')}\n`;
      }
      Object.entries(wrongGroups).forEach(([sign, names]) => {
        tipsText += `Fel (${sign}): ${names.join(', ')}\n`;
      });
    }

    const prompt = `Du är "Statistikern", en bot i en intern tipsliga för Fotbolls-VM 2026. Din personlighet: kunnig, varm och rolig med ett gott sinne för humor. Du är mer en entusiastisk fotbollskommentator än en domstol – du belyser gruppens kollektiva spelande med glimt i ögat, utan att hänga ut individer.

Matchen ${team1} mot ${team2} slutade ${g1} - ${g2} (rätt tecken: ${correctSign}).

Tippade deltagare:
${tipsText}

INSTRUKTIONER:
1. Sök på nätet efter matchen och hämta bara dessa EXAKTA fem statistikvärden: bollinnehav (%), hörnor, gula kort, röda kort, frisparkar. Ta BARA med rader du hittar data för.
2. Skriv en levande matchsammanfattning (2-3 meningar) – lyft fram något intressant eller dramatiskt.
3. Skriv "Statistikerns Dom" med värme och humor:
   - Kommentera hur gruppen tippade på ett roligt sätt – var klyftig, inte elak.
   - Om någon stack ut positivt (hade rätt när få andra hade det), lyft gärna fram dem med @Förnamn.
   - Undvik att lista upp eller hänga ut de som tippade fel – det räcker med en smidig sidokommentar om det passar naturligt.
   - Fokusera mer på matchen och stämningen än på att döma tipparna.
   - Inga långa namnlistor.

VIKTIGT FORMAT – följ detta EXAKT, avvik inte:
- Inga bullet points (-)
- Inga asterisk-listor (*)
- Inga extra fält som målskyttar, arena, datum, publik etc.
- Matchfakta-sektionen innehåller ENBART de fem ikon-raderna nedan

Formatera svaret EXAKT så här:

*${team1} ${g1} - ${g2} ${team2} är slutspelad!* 🏁

📝 **Matchsammanfattning:**
[sammanfattning]

📈 **Matchfakta (${team1} - ${team2}):**
⚽️ Bollinnehav: X% - Y%
🚩 Hörnor: X - Y
🟨 Gula kort: X - Y
🟥 Röda kort: X - Y
👟 Frisparkar: X - Y

🎯 **Statistikerns Dom:**
[din analys]

*(Totalt ${totalTournamentGoals} mål i turneringen hittills)*`;

    let aiText = "";
    let geminiSuccess = false;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Anropar Gemini (försök ${attempt}/${maxRetries})...`);
        if (attempt > 1) {
          const waitMs = attempt * 10000; // 10s, 20s
          console.log(`Väntar ${waitMs/1000}s innan nytt försök...`);
          await new Promise(r => setTimeout(r, waitMs));
        }
        const result = await model.generateContent(prompt);
        aiText = result.response.text();
        geminiSuccess = true;
        break;
      } catch (err) {
        console.error(`Gemini-fel vid försök ${attempt}:`, err.message || err);
        if (attempt === maxRetries) {
          console.error("Alla Gemini-försök misslyckades. Hoppar över denna match.");
        }
      }
    }

    if (!geminiSuccess) {
      console.log(`Skipping match ${match.id} – postar inte felmeddelandeett till chatten.`);
      continue; // hoppar till nästa match utan att posta
    }


    if (match.isNew || !match.statsChatId) {
      const postTimestamp = getMatchPostTimestamp(match.id);
      console.log(`⏰ Tidsstämpel för match ${match.id}: ${postTimestamp}`);
      const chatRef = await db.collection("chat").add({
        text: aiText,
        user: "🤖 Statistikern",
        createdAt: admin.firestore.Timestamp.fromDate(new Date(postTimestamp))
      });

      await db.collection("matches").doc(match.id.toString()).update({
        statsPosted: true,
        statsChatId: chatRef.id,
        statsGoals1: g1,
        statsGoals2: g2
      });
      console.log(`✅ Nytt inlägg för match ${match.id}`);
    } else {
      await db.collection("chat").doc(match.statsChatId).update({
        text: aiText + "\n\n*(✏️ Uppdaterat pga korrigerat matchresultat)*"
      });

      await db.collection("matches").doc(match.id.toString()).update({
        statsGoals1: g1,
        statsGoals2: g2
      });
      console.log(`✅ Uppdaterat inlägg för match ${match.id}`);
    }

    // Skicka @-notiser till omnämnda deltagare
    await sendMentionNotifications(aiText, allTips);
  }

  console.log("Statistikern klar!");
  process.exit(0);
}

run().catch(err => {
  console.error("Oväntat fel:", err);
  process.exit(1);
});
