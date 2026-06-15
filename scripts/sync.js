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
  'Czechia': 'Tjeckien',
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

const VM_SCHEDULE = [
  "1|11 jun 21:00|A|Mexiko|Sydafrika|Azteca|Mexico City|Mexiko|SVT",
  "3|12 jun 04:00|A|Sydkorea|Tjeckien|Akron|Guadalajara|Mexiko|SVT",
  "2|12 jun 21:00|B|Kanada|Bosnien|BMO Field|Toronto|Kanada|TV4",
  "4|13 jun 03:00|D|USA|Paraguay|SoFi|Los Angeles|USA|TV4",
  "5|13 jun 21:00|B|Qatar|Schweiz|Levi's|San Francisco|USA|SVT",
  "6|14 jun 00:00|C|Brasilien|Marocko|MetLife|New Jersey|USA|TV4",
  "7|14 jun 03:00|C|Haiti|Skottland|Gillette|Boston|USA|SVT",
  "8|14 jun 06:00|D|Australien|Turkiet|BC Place|Vancouver|Kanada|TV4",
  "9|14 jun 19:00|E|Tyskland|Curaçao|NRG|Houston|USA|SVT",
  "10|14 jun 22:00|F|Nederländerna|Japan|AT&T|Dallas|USA|TV4",
  "11|15 jun 01:00|E|Elfenbenskusten|Ecuador|Lincoln|Philadelphia|USA|SVT",
  "12|15 jun 04:00|F|Sverige|Tunisien|BBVA|Monterrey|Mexiko|TV4",
  "13|15 jun 18:00|H|Spanien|Kap Verde|Mercedes|Atlanta|USA|SVT",
  "14|15 jun 21:00|G|Belgien|Egypten|Lumen|Seattle|USA|TV4",
  "15|16 jun 00:00|H|Saudiarabien|Uruguay|Hard Rock|Miami|USA|SVT",
  "16|16 jun 03:00|G|Iran|Nya Zeeland|SoFi|Los Angeles|USA|TV4",
  "17|16 jun 21:00|I|Frankrike|Senegal|MetLife|New Jersey|USA|SVT",
  "18|17 jun 00:00|I|Irak|Norge|Gillette|Boston|USA|TV4",
  "19|17 jun 03:00|J|Argentina|Algeriet|Arrowhead|Kansas City|USA|SVT",
  "20|17 jun 06:00|J|Österrike|Jordanien|Levi's|San Francisco|USA|TV4",
  "21|17 jun 19:00|K|Portugal|DR Kongo|NRG|Houston|USA|SVT",
  "22|17 jun 22:00|L|England|Kroatien|AT&T|Dallas|USA|TV4",
  "23|18 jun 01:00|L|Ghana|Panama|BMO Field|Toronto|Kanada|SVT",
  "24|18 jun 04:00|K|Uzbekistan|Colombia|Azteca|Mexico City|Mexiko|TV4",
  "25|18 jun 18:00|A|Tjeckien|Sydafrika|Mercedes|Atlanta|USA|SVT",
  "26|18 jun 21:00|B|Schweiz|Bosnien|SoFi|Los Angeles|USA|TV4",
  "27|19 jun 00:00|B|Kanada|Qatar|BC Place|Vancouver|Kanada|SVT",
  "28|19 jun 03:00|A|Mexiko|Sydkorea|Akron|Guadalajara|Mexiko|TV4",
  "29|19 jun 21:00|D|USA|Australien|Lumen|Seattle|USA|SVT",
  "30|20 jun 00:00|C|Skottland|Marocko|Gillette|Boston|USA|TV4",
  "31|20 jun 02:30|C|Brasilien|Haiti|Lincoln|Philadelphia|USA|SVT",
  "32|20 jun 05:00|D|Turkiet|Paraguay|Levi's|San Francisco|USA|TV4",
  "33|20 jun 19:00|F|Nederländerna|Sverige|NRG|Houston|USA|SVT",
  "34|20 jun 22:00|E|Tyskland|Elfenbenskusten|BMO Field|Toronto|Kanada|TV4",
  "35|21 jun 02:00|E|Ecuador|Curaçao|Arrowhead|Kansas City|USA|SVT",
  "36|21 jun 06:00|F|Tunisien|Japan|BBVA|Monterrey|Mexiko|TV4",
  "37|21 jun 18:00|H|Spanien|Saudiarabien|Mercedes|Atlanta|USA|SVT",
  "38|21 jun 21:00|G|Belgien|Iran|SoFi|Los Angeles|USA|TV4",
  "39|22 jun 00:00|H|Uruguay|Kap Verde|Hard Rock|Miami|USA|SVT",
  "40|22 jun 03:00|G|Nya Zeeland|Egypten|BC Place|Vancouver|Kanada|TV4",
  "41|22 jun 19:00|J|Argentina|Österrike|Arrowhead|Kansas City|USA|SVT",
  "42|22 jun 23:00|I|Frankrike|Irak|Lincoln|Philadelphia|USA|TV4",
  "43|23 jun 02:00|I|Norge|Senegal|MetLife|New Jersey|USA|SVT",
  "44|23 jun 05:00|J|Jordanien|Algeriet|Levi's|San Francisco|USA|TV4",
  "45|23 jun 19:00|K|Portugal|Uzbekistan|NRG|Houston|USA|SVT",
  "46|23 jun 22:00|L|England|Ghana|Gillette|Boston|USA|TV4",
  "47|24 jun 01:00|L|Panama|Kroatien|Gillette|Boston|USA|SVT",
  "48|24 jun 04:00|K|Colombia|DR Kongo|Akron|Guadalajara|Mexiko|TV4",
  "51|24 jun 21:00|B|Bosnien|Qatar|BMO Field|Toronto|Kanada|SVT",
  "52|24 jun 21:00|B|Schweiz|Kanada|BC Place|Vancouver|Kanada|TV4",
  "53|25 jun 00:00|C|Marocko|Haiti|Hard Rock|Miami|USA|SVT",
  "54|25 jun 00:00|C|Skottland|Brasilien|MetLife|New Jersey|USA|TV4",
  "49|25 jun 03:00|A|Sydafrika|Sydkorea|Mercedes|Atlanta|USA|SVT",
  "50|25 jun 03:00|A|Tjeckien|Mexiko|Azteca|Mexico City|Mexiko|TV4",
  "57|25 jun 22:00|E|Curaçao|Elfenbenskusten|Mercedes|Atlanta|USA|SVT",
  "58|25 jun 22:00|E|Ecuador|Tyskland|AT&T|Dallas|USA|TV4",
  "60|26 jun 01:00|F|Tunisien|Nederländerna|Arrowhead|Kansas City|USA|TV4",
  "55|26 jun 04:00|D|Paraguay|Australien|Lumen|Seattle|USA|SVT",
  "56|26 jun 04:00|D|Turkiet|USA|SoFi|Los Angeles|USA|TV4",
  "65|26 jun 21:00|I|Senegal|Irak|Mercedes|Atlanta|USA|SVT",
  "66|26 jun 21:00|I|Norge|Frankrike|MetLife|New Jersey|USA|SVT",
  "59|27 jun 00:00|F|Sverige|Japan|Azteca|Mexico City|Mexiko|SVT",
  "64|27 jun 02:00|H|Uruguay|Spanien|Hard Rock|Miami|USA|TV4",
  "61|27 jun 05:00|G|Egypten|Iran|Lincoln|Philadelphia|USA|SVT",
  "62|27 jun 05:00|G|Nya Zeeland|Belgien|SoFi|Los Angeles|USA|TV4",
  "71|27 jun 23:00|L|Kroatien|Ghana|AT&T|Dallas|USA|SVT",
  "72|27 jun 23:00|L|Panama|England|BMO Field|Toronto|Kanada|TV4",
  "63|28 jun 00:00|H|Kap Verde|Saudiarabien|Lumen|Seattle|USA|SVT",
  "70|28 jun 01:30|K|Colombia|Portugal|NRG|Houston|USA|TV4",
  "67|28 jun 04:00|J|Algeriet|Österrike|Gillette|Boston|USA|SVT",
  "68|28 jun 04:00|J|Jordanien|Argentina|Arrowhead|Kansas City|USA|TV4",
  "69|29 jun 18:00|K|DR Kongo|Uzbekistan|Azteca|Mexico City|Mexiko|SVT"
];

const staticMatches = VM_SCHEDULE.map(m => {
  const [id, date, grp, t1, t2] = m.split('|');
  return { id: parseInt(id), team1: t1, team2: t2 };
});

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

      // Hitta matchen i statiska schemat baserat på lagen
      const staticMatch = staticMatches.find(x => x.team1 === homeTeam && x.team2 === awayTeam);

      if (staticMatch) {
        const matchId = staticMatch.id;
        // Hämta befintlig data från dbMatches eller skapa ett tomt objekt
        const mDb = dbMatches.find(x => x.id === matchId) || { id: matchId };

        const apiGoalsHome = mApi.score?.fullTime?.home ?? null;
        const apiGoalsAway = mApi.score?.fullTime?.away ?? null;
        const apiStatus = mApi.status === 'FINISHED' ? 'finished' : (['IN_PLAY','LIVE','PAUSED'].includes(mApi.status) ? 'live' : 'upcoming');
        const apiMinute = mApi.minute?.toString() || null;

        let needsUpdate = false;
        let updateData = {};

        // Alltid spara lagnamn så att statistikern kan hämta dem
        if (mDb.team1 !== homeTeam) { updateData.team1 = homeTeam; needsUpdate = true; }
        if (mDb.team2 !== awayTeam) { updateData.team2 = awayTeam; needsUpdate = true; }
        if (mDb.goals1 !== apiGoalsHome) { updateData.goals1 = apiGoalsHome; needsUpdate = true; }
        if (mDb.goals2 !== apiGoalsAway) { updateData.goals2 = apiGoalsAway; needsUpdate = true; }
        if (mDb.status !== apiStatus) { updateData.status = apiStatus; needsUpdate = true; }
        if (mDb.minute !== apiMinute) { updateData.minute = apiMinute; needsUpdate = true; }

        if (needsUpdate) {
           console.log(`Uppdaterar match ${matchId} (${homeTeam} vs ${awayTeam}):`, updateData);
           updatesPromises.push(db.collection("matches").doc(matchId.toString()).set(updateData, { merge: true }));
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
     console.log("Minst en match är LIVE. Startar loop var 10:e minut i 30 minuter...");
     let count = 0;
     const maxLoops = 3;

     const interval = setInterval(async () => {
         count++;
         console.log(`--- Loop iteration ${count}/${maxLoops} ---`);
         const stillLive = await fetchAndSync();

         if (count >= maxLoops) {
             console.log("Max antal loop-iterationer nådd (30 min). Avslutar.");
             clearInterval(interval);
             process.exit(0);
         }

     }, 600000); // 10 minuter
  } else {
     console.log("Inga matcher är LIVE. Avslutar direkt.");
     process.exit(0);
  }
}

run();