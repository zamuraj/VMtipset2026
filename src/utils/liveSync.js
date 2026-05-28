export const fetchLiveResultsLogic = async (API_KEY, matches, updateMatch) => {
  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', { headers: { 'X-Auth-Token': API_KEY } });
    if (response.status === 429) {
      console.warn("Live-sync: API Rate limit nådd. Avvaktar till nästa cykel.");
      return;
    }
    if (!response.ok) throw new Error('API-fel: ' + response.status);
    const data = await response.json();
    const map = { 'Mexico':'Mexiko', 'Ecuador':'Ecuador', 'Canada':'Kanada', 'Slovakia':'Slovakien', 'Italy':'Italien', 'Togo':'Togo', 'United States':'USA', 'Morocco':'Marocko', 'Spain':'Spanien', 'Japan':'Japan', 'Brazil':'Brasilien', 'South Korea':'Sydkorea', 'Sweden':'Sverige', 'Jordan':'Jordanien', 'England':'England', 'Peru':'Peru', 'Germany':'Tyskland', 'Norway':'Norge', 'France':'Frankrike', 'Uzbekistan':'Uzbekistan', 'Uruguay':'Uruguay', 'Cameroon':'Kamerun', 'Netherlands':'Nederländerna', 'Australia':'Australien', 'Argentina':'Argentina', 'Haiti':'Haiti', 'Belgium':'Belgien', 'Panama':'Panama', 'Portugal':'Portugal', 'Senegal':'Senegal', 'Denmark':'Danmark', 'Nigeria':'Nigeria', 'South Africa':'Sydafrika', 'Czech Republic':'Tjeckien', 'Bosnia-Herzegovina':'Bosnien', 'Paraguay':'Paraguay', 'Qatar':'Qatar', 'Switzerland':'Schweiz', 'Scotland':'Skottland', 'Turkey':'Turkiet', 'Curaçao':'Curaçao', 'Ivory Coast':'Elfenbenskusten', 'Tunisia':'Tunisien', 'Cape Verde':'Kap Verde', 'Egypt':'Egypten', 'Saudi Arabia':'Saudiarabien', 'Iran':'Iran', 'New Zealand':'Nya Zeeland', 'Iraq':'Irak', 'Algeria':'Algeriet', 'Austria':'Österrike', 'DR Congo':'DR Kongo', 'Colombia':'Colombia', 'Croatia':'Kroatien', 'Ghana':'Ghana' };
    data.matches?.forEach(mApi => {
      const h = map[mApi.homeTeam.name] || mApi.homeTeam.name;
      const a = map[mApi.awayTeam.name] || mApi.awayTeam.name;
      const m = matches.find(x => x.team1 === h && x.team2 === a);
      if (m) {
        const g1 = mApi.score.fullTime.home, g2 = mApi.score.fullTime.away;
        const st = mApi.status === 'FINISHED' ? 'finished' : (['IN_PLAY','LIVE','PAUSED'].includes(mApi.status) ? 'live' : 'upcoming');
        if (m.goals1 !== g1 || m.goals2 !== g2 || m.status !== st) updateMatch(m.id, { goals1: g1, goals2: g2, status: st, minute: mApi.minute?.toString() || null });
      }
    });
  } catch(e) { console.error("Live Sync Error:", e); }
};
