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

  // 1. Hämta matcher som är avslutade men ej uppdaterade av statistikern
  // För att spara reads, hämtar vi alla matcher och kollar lokalt (alternativt .where, men i detta projekt är det < 72 dokument)
  const matchesSnapshot = await db.collection("matches").get();
  
  let totalTournamentGoals = 0;
  const finishedMatchesToReport = [];

  matchesSnapshot.forEach(doc => {
    const d = doc.data();
    if (d.status === "FINISHED") {
      if (d.goals1 != null && d.goals2 != null) {
        totalTournamentGoals += (d.goals1 + d.goals2);
      }
      if (!d.statsPosted) {
        finishedMatchesToReport.push({ id: doc.id, ...d });
      }
    }
  });

  if (finishedMatchesToReport.length === 0) {
    console.log("Inga nya avslutade matcher att rapportera om.");
    process.exit(0);
  }

  // Hämta alla användares tips
  const tipsSnapshot = await db.collection("tips").get();
  const allTips = tipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  for (const match of finishedMatchesToReport) {
    console.log(`Bearbetar match ${match.id}: ${match.team1} - ${match.team2}`);

    const team1 = match.team1 || "Lag 1";
    const team2 = match.team2 || "Lag 2";
    const g1 = match.goals1;
    const g2 = match.goals2;
    
    // Beräkna tips
    let correctSign = "X";
    if (g1 > g2) correctSign = "1";
    if (g2 > g1) correctSign = "2";

    let signCounts = { "1": 0, "X": 0, "2": 0 };
    let correctTippers = [];

    allTips.forEach(tipDoc => {
      const pTips = tipDoc.tips || {};
      const userSign = pTips[match.id];
      if (userSign) {
        signCounts[userSign] = (signCounts[userSign] || 0) + 1;
        if (userSign === correctSign) {
          const firstName = (tipDoc.name || tipDoc.id).split(' ')[0];
          correctTippers.push("@" + firstName);
        }
      }
    });

    const totalTippers = signCounts["1"] + signCounts["X"] + signCounts["2"];
    
    let shoutoutText = "";
    if (correctTippers.length > 0 && correctTippers.length <= 5) {
      shoutoutText = `Snyggt jobbat ${correctTippers.join(', ')}! 🎯`;
    } else if (correctTippers.length > 5) {
      shoutoutText = `Snyggt jobbat alla ${correctTippers.length} som hade rätt! 🎯`;
    } else {
      shoutoutText = `Ingen hade rätt tecken! 🤯`;
    }

    // --- ANROPA GEMINI FÖR EXTERNA STATS ---
    const prompt = `Du är "Statistikern", en bot som rapporterar resultat från Fotbolls-VM 2026.
Matchen ${team1} mot ${team2} har precis slutat ${g1} - ${g2}.
Sök information om matchen och ge mig exakta siffror för: Bollinnehav (%), Hörnor, Gula kort, Röda kort, och Frisparkar för båda lagen. Ge mig också en kort (1-3 meningar) och medryckande matchsammanfattning.
Formatera ditt svar EXAKT så här (använd 'Okänt' om du inte hittar siffran):

📝 **Matchsammanfattning:**
[Din sammanfattning]

📈 **Matchfakta (${team1} - ${team2}):**
⚽️ Bollinnehav: [X]% - [Y]%
🚩 Hörnor: [X] - [Y]
🟨 Gula kort: [X] - [Y]
🟥 Röda kort: [X] - [Y]
👟 Frisparkar: [X] - [Y]`;

    let aiText = "";
    try {
      console.log("Anropar Gemini för fakta...");
      const result = await model.generateContent(prompt);
      aiText = result.response.text();
    } catch (err) {
      console.error("Fel vid anrop till Gemini:", err);
      aiText = `📝 **Matchsammanfattning:**
(Kunde inte hämta matchrapport från nätet just nu)

📈 **Matchfakta:**
(Data saknas)`;
    }

    // --- BYGG MEDDELANDE ---
    const finalMessage = `*${team1} ${g1} - ${g2} ${team2} är slutspelad!* 🏁\n\n${aiText}\n\n🎯 **Hur tippade gruppen?**\n- **${correctTippers.length} av ${totalTippers}** tippade rätt tecken (${correctSign}). ${shoutoutText}\n- Fördelning av tips: 1 (${signCounts["1"]}), X (${signCounts["X"]}), 2 (${signCounts["2"]})\n- Totalt har det nu gjorts **${totalTournamentGoals} mål** i VM!`;

    // Spara till chat
    await db.collection("chat").add({
      text: finalMessage,
      user: "🤖 Statistikern",
      createdAt: new Date().toISOString()
    });

    // Markera matchen
    await db.collection("matches").doc(match.id.toString()).update({
      statsPosted: true
    });

    console.log(`Skickade chat-meddelande för match ${match.id}`);
  }

  console.log("Klart!");
  process.exit(0);
}

run().catch(err => {
  console.error("Oväntat fel:", err);
  process.exit(1);
});
