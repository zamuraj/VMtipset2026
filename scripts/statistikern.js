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

  // Tips sparas under fältet "predictions" i "tips"-kollektionen
  // Nyckeln är matchens numeriska ID (t.ex. 1, 49, 72)
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

    // Tips sparas som predictions[matchId] där matchId är ett NUMBER
    const matchIdNum = parseInt(match.id);
    const userTipsList = [];

    allTips.forEach(tipDoc => {
      // Fältet heter "predictions" (inte "tips")
      const predictions = tipDoc.predictions || {};
      // Nyckeln kan vara nummer eller sträng beroende på hur det sparats
      const userSign = predictions[matchIdNum] || predictions[match.id] || predictions[String(matchIdNum)];
      if (userSign) {
        const firstName = (tipDoc.name || tipDoc.id).split(' ')[0];
        userTipsList.push(`${firstName}: ${userSign}`);
      }
    });

    console.log(`Hittade ${userTipsList.length} tips för match ${match.id} (${team1} vs ${team2}). matchIdNum=${matchIdNum}`);

    const tipsText = userTipsList.length > 0
      ? userTipsList.join(', ')
      : '(Inga tips registrerade för denna match ännu)';

    const prompt = `Du är "Statistikern", en bot i en chatt för en intern tipsliga i Fotbolls-VM 2026. Din ton är kaxig, sarkastisk, rolig och skoningslös mot de som tippar dåligt, men du kan hylla genier.
Matchen ${team1} mot ${team2} har precis slutat ${g1} - ${g2} (Rätt tecken: ${correctSign}).

Här är vad deltagarna tippade i vår grupp (Format: Namn: Tecken):
${tipsText}

Uppgift 1: Sök på nätet efter den exakta matchen (VM 2026, ${team1} vs ${team2}) och hämta verkliga siffror för Bollinnehav (%), Hörnor, Gula kort, Röda kort, och Frisparkar. Ta BARA med statistikrader som du faktiskt hittar data för. Utelämna rader där data saknas helt – skriv inte "Okänt" eller "0" för saknad data.
Uppgift 2: Skriv en rolig matchsammanfattning (ca 2 meningar).
Uppgift 3: Analysera gruppens tips och skriv en kaxig sektion. Kalla ut folk vid namn om de tippade fel. Hylla de som hade rätt. Om inga tips finns, håna gruppen för att de inte brytt sig om att tippa.

Formatera ditt EXAKTA svar så här (utelämna statistikrader som du inte hittar data för):

*${team1} ${g1} - ${g2} ${team2} är slutspelad!* 🏁

📝 **Matchsammanfattning:**
[Din sammanfattning]

📈 **Matchfakta (${team1} - ${team2}):**
[Inkludera bara rader med verklig data, t.ex:]
⚽️ Bollinnehav: [X]% - [Y]%
🚩 Hörnor: [X] - [Y]
🟨 Gula kort: [X] - [Y]
🟥 Röda kort: [X] - [Y]
👟 Frisparkar: [X] - [Y]

🎯 **Statistikerns Dom:**
[Din analys. Var rolig och hård!]

*(Totalt ${totalTournamentGoals} mål i turneringen hittills)*`;

    let aiText = "";
    try {
      console.log("Anropar Gemini...");
      const result = await model.generateContent(prompt);
      aiText = result.response.text();
    } catch (err) {
      console.error("Fel vid anrop till Gemini:", err);
      aiText = `*${team1} ${g1} - ${g2} ${team2} är slutspelad!* 🏁\n\n(Tekniskt fel – ni slipper mitt hån den här gången. Men bara den här gången.)`;
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
  }

  console.log("Statistikern klar!");
  process.exit(0);
}

run().catch(err => {
  console.error("Oväntat fel:", err);
  process.exit(1);
});
