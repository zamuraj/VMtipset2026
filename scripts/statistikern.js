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
  model: "gemini-2.5-flash",
  tools: [{ googleSearch: {} }]
});

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

  for (const match of matchesToProcess) {
    const team1 = match.team1 || "Okänt lag 1";
    const team2 = match.team2 || "Okänt lag 2";
    const g1 = match.goals1;
    const g2 = match.goals2;

    console.log(`Bearbetar: ${team1} ${g1}-${g2} ${team2}`);

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

    const prompt = `Du är "Statistikern", en bot i en intern tipsliga för Fotbolls-VM 2026. Din personlighet: vass, rolig, lite elak men med hjärta. Du kommenterar som en sarkastisk fotbollsexpert, inte som en robot som listar namn.

Matchen ${team1} mot ${team2} slutade ${g1} - ${g2} (rätt tecken: ${correctSign}).

Tippade deltagare:
${tipsText}

INSTRUKTIONER:
1. Sök på nätet efter matchen och hämta bara dessa EXAKTA fem statistikvärden: bollinnehav (%), hörnor, gula kort, röda kort, frisparkar. Ta BARA med rader du hittar data för.
2. Skriv en medryckande matchsammanfattning (2-3 meningar).
3. Skriv "Statistikerns Dom" med känsla och personlighet:
   - Om fler än 5 hade rätt: Beröm gruppen kortfattat, nämn inga individuella namn.
   - Om 1-5 hade rätt: Lyft fram dem med @Förnamn (stor bokstav), de förtjänar heder.
   - Nämn 1-3 individer som stack ut negativt med @Förnamn om det är roligt/intressant.
   - Undvik långa namnlistor – berätta en historia istället.

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
      const chatRef = await db.collection("chat").add({
        text: aiText,
        user: "🤖 Statistikern",
        createdAt: new Date().toISOString()
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
