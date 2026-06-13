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
  console.error("Saknar miljövariabel GEMINI_API_KEY. Lägg till den i .env eller GitHub Secrets.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{ googleSearch: {} }]
});

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
      // Uppdatera om resultatet har ändrats sedan sist (VAR etc.)
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

  for (const match of matchesToProcess) {
    const team1 = match.team1 || "Okänt lag 1";
    const team2 = match.team2 || "Okänt lag 2";
    const g1 = match.goals1;
    const g2 = match.goals2;

    console.log(`Bearbetar: ${team1} ${g1}-${g2} ${team2} (isNew: ${match.isNew})`);

    let correctSign = "X";
    if (g1 > g2) correctSign = "1";
    if (g2 > g1) correctSign = "2";

    // Tips-keys kan vara nummer eller sträng, prova båda
    const userTipsList = [];
    allTips.forEach(tipDoc => {
      const pTips = tipDoc.tips || {};
      const userSign = pTips[match.id] || pTips[parseInt(match.id)] || pTips[Number(match.id)];
      if (userSign) {
        const firstName = (tipDoc.name || tipDoc.id).split(' ')[0];
        userTipsList.push(`${firstName}: ${userSign}`);
      }
    });

    console.log(`Hittade ${userTipsList.length} tips för matchen.`);

    const tipsText = userTipsList.length > 0
      ? userTipsList.join(', ')
      : '(Inga registrerade tips hittades för denna match)';

    const prompt = `Du är "Statistikern", en bot i en chatt för en intern tipsliga i Fotbolls-VM 2026. Din ton är kaxig, sarkastisk, rolig och skoningslös mot de som tippar dåligt, men du kan hylla genier.
Matchen ${team1} mot ${team2} har precis slutat ${g1} - ${g2} (Rätt tecken: ${correctSign}).

Här är vad deltagarna tippade i vår grupp (Format: Namn: Tecken):
${tipsText}

Uppgift 1: Sök information om matchen och hämta verkliga siffror för Bollinnehav (%), Hörnor, Gula kort, Röda kort, och Frisparkar för båda lagen. Om nån data inte finns tillgänglig, skriv 'Okänt'.
Uppgift 2: Skriv en rolig matchsammanfattning (ca 2 meningar).
Uppgift 3: Analysera gruppens tips och skriv en kaxig sektion där du hänger ut de som tippade helt galet (kalla ut deras namn) eller hyllar de få som hade rätt. Om inga tips registrerats, säg det på ett kaxigt sätt.

Formatera ditt EXAKTA svar så här:

*${team1} ${g1} - ${g2} ${team2} är slutspelad!* 🏁

📝 **Matchsammanfattning:**
[Din sammanfattning]

📈 **Matchfakta (${team1} - ${team2}):**
⚽️ Bollinnehav: [X]% - [Y]%
🚩 Hörnor: [X] - [Y]
🟨 Gula kort: [X] - [Y]
🟥 Röda kort: [X] - [Y]
👟 Frisparkar: [X] - [Y]

🎯 **Statistikerns Dom över Tipsligan:**
[Din analys av deltagarnas tips. Kalla ut folk vid namn. Var rolig och hård!]

*(Totalt ${totalTournamentGoals} mål i turneringen hittills)*`;

    let aiText = "";
    try {
      console.log("Anropar Gemini...");
      const result = await model.generateContent(prompt);
      aiText = result.response.text();
    } catch (err) {
      console.error("Fel vid anrop till Gemini:", err);
      aiText = `*${team1} ${g1} - ${g2} ${team2} är slutspelad!* 🏁\n\n(Ett tekniskt fel uppstod. Ni slipper mitt hån den här gången – men bara den här gången.)`;
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
      console.log(`✅ Nytt inlägg skapat för match ${match.id}`);
    } else {
      await db.collection("chat").doc(match.statsChatId).update({
        text: aiText + "\n\n*(✏️ Uppdaterat pga korrigerat matchresultat)*"
      });

      await db.collection("matches").doc(match.id.toString()).update({
        statsGoals1: g1,
        statsGoals2: g2
      });
      console.log(`✅ Uppdaterat befintligt inlägg för match ${match.id}`);
    }
  }

  console.log("Statistikern klar!");
  process.exit(0);
}

run().catch(err => {
  console.error("Oväntat fel:", err);
  process.exit(1);
});
