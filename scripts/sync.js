import admin from 'firebase-admin';

// Teams mapping från App.jsx
const TEAMS_MAP = {
  'Mexico': 'Mexiko',
  'Ecuador': 'Ecuador',
  'Canada': 'Kanada',
  'Slovakia': 'Slovakien',
  'Italy': 'Italien',
  'Togo': 'Togo',
  'United States': 'USA',
  'Morocco': 'Marocko',
  'Spain': 'Spanien',
  'Japan': 'Japan',
  'Brazil': 'Brasilien',
  'South Korea': 'Sydkorea',
  'Sweden': 'Sverige',
  'Jordan': 'Jordanien',
  'England': 'England',
  'Peru': 'Peru',
  'Germany': 'Tyskland',
  'Norway': 'Norge',
  'France': 'Frankrike',
  'Uzbekistan': 'Uzbekistan',
  'Uruguay': 'Uruguay',
  'Cameroon': 'Kamerun',
  'Netherlands': 'Nederländerna',
  'Australia': 'Australien',
  'Argentina': 'Argentina',
  'Haiti': 'Haiti',
  'Belgium': 'Belgien',
  'Panama': 'Panama',
  'Portugal': 'Portugal',
  'Senegal': 'Senegal',
  'Denmark': 'Danmark',
  'Nigeria': 'Nigeria',
  'South Africa': 'Sydafrika',
  'Czech Republic': 'Tjeckien',
  'Bosnia-Herzegovina': 'Bosnien',
  'Paraguay': 'Paraguay',
  'Qatar': 'Qatar',
  'Switzerland': 'Schweiz',
  'Scotland': 'Skottland',
  'Turkey': 'Turkiet',
  'Curaçao': 'Curaçao',
  'Ivory Coast': 'Elfenbenskusten',
  'Tunisia': 'Tunisien',
  'Cape Verde': 'Kap Verde',
  'Egypt': 'Egypten',
  'Saudi Arabia': 'Saudiarabien',
  'Iran': 'Iran',
  'New Zealand': 'Nya Zeeland',
  'Iraq': 'Irak',
  'Algeria': 'Algeriet',
  'Austria': 'Österrike',
  'DR Congo': 'DR Kongo',
  'Colombia': 'Colombia',
  'Croatia': 'Kroatien',
  'Ghana': 'Ghana'
};

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error("Saknar miljövariabel FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

if (!API_KEY) {
  console.error("Saknar miljövariabel FOOTBALL_DATA_API_KEY");
  process.exit(1);
}

async function fetchAndSync() {
  console.log(`[${new Date().toISOString()}] Hämtar matcher från football-data.org...`);
  try {
    const response = await fetch(API_URL, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    if (response.status === 429) {
      console.warn("API Rate limit nådd. Avvaktar...");
      return false; // Return false so we don't assume there's no live match and stop looping if we're looping.
    }

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();

    if (!data.matches) {
       console.log("Inga matcher i svaret från API.");
       return false;
    }

    // Kolla om någon match är LIVE ("IN_PLAY", "PAUSED", "LIVE")
    const isAnyLive = data.matches.some(m => ['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status));

    // Hämta matcher från Firebase
    const matchesSnapshot = await db.collection("matches").get();
    const dbMatches = matchesSnapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));

    let updatesPromises = [];

    data.matches.forEach(mApi => {
      // Mappa API lag-namn till våra interna
      const homeTeam = TEAMS_MAP[mApi.homeTeam.name] || mApi.homeTeam.name;
      const awayTeam = TEAMS_MAP[mApi.awayTeam.name] || mApi.awayTeam.name;

      // Hitta matchen i databasen baserat på lagen
      const mDb = dbMatches.find(x => x.team1 === homeTeam && x.team2 === awayTeam);

      if (mDb) {
        const apiGoalsHome = mApi.score?.fullTime?.home ?? null;
        const apiGoalsAway = mApi.score?.fullTime?.away ?? null;
        const apiStatus = mApi.status === 'FINISHED' ? 'finished' : (['IN_PLAY','LIVE','PAUSED'].includes(mApi.status) ? 'live' : 'upcoming');
        const apiMinute = mApi.minute?.toString() || null;

        let needsUpdate = false;
        let updateData = {};

        if (mDb.goals1 !== apiGoalsHome) { updateData.goals1 = apiGoalsHome; needsUpdate = true; }
        if (mDb.goals2 !== apiGoalsAway) { updateData.goals2 = apiGoalsAway; needsUpdate = true; }
        if (mDb.status !== apiStatus) { updateData.status = apiStatus; needsUpdate = true; }
        if (mDb.minute !== apiMinute) { updateData.minute = apiMinute; needsUpdate = true; }

        if (needsUpdate) {
           console.log(`Uppdaterar match ${mDb.id} (${homeTeam} vs ${awayTeam}):`, updateData);
           updatesPromises.push(db.collection("matches").doc(mDb.id.toString()).set(updateData, { merge: true }));
        }
      }
    });

    await Promise.all(updatesPromises);
    if(updatesPromises.length > 0) {
        console.log(`Uppdaterade ${updatesPromises.length} matcher i databasen.`);
    }

    return isAnyLive;

  } catch (error) {
    console.error("Fel vid hämtning/synk:", error);
    return false;
  }
}

async function run() {
  console.log("Startar sync.js...");
  const isLive = await fetchAndSync();

  if (isLive) {
     console.log("Minst en match är LIVE. Startar loop varje minut i 30 minuter...");
     let count = 0;
     const maxLoops = 30;

     const interval = setInterval(async () => {
         count++;
         console.log(`--- Loop iteration ${count}/${maxLoops} ---`);
         const stillLive = await fetchAndSync();

         if (count >= maxLoops) {
             console.log("Max antal loop-iterationer nådd (30 min). Avslutar.");
             clearInterval(interval);
             process.exit(0);
         }

         // Avbryta tidigare om inga matcher längre är live?
         // Issue 3: "Om en match är 'LIVE', kör en loop som hämtar data och uppdaterar Firebase varje minut i 30 minuter, sen avsluta (så att GitHub-cron kan starta nästa)."
         // "sen avsluta" implicerar att den kör alla 30 minuter, så vi kan låta den göra det.
         // Om man vill avbryta if(!stillLive) kan man göra det, men vi följer instruktionerna.

     }, 60000); // 1 minut
  } else {
     console.log("Inga matcher är LIVE. Avslutar direkt.");
     process.exit(0);
  }
}

run();