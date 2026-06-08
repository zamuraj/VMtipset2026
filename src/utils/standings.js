export function calculateGroupStandings(TEAMS, matches, folketsTipsMode, folketsTips) {
  const stats = {};
  const forecastTeams = new Set();

  Object.keys(TEAMS).forEach(name => {
    stats[name] = { name, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0, group: "", hasForecast: false };
  });

  matches.forEach(m => {
    if (stats[m.team1]) stats[m.team1].group = m.group;
    if (stats[m.team2]) stats[m.team2].group = m.group;

    let g1, g2, isPlayed = false, isForecast = false;

    if (folketsTipsMode === 1) {
      const p = folketsTips[m.id];
      if (p === '1') { g1 = 1; g2 = 0; isPlayed = true; isForecast = true; }
      else if (p === '2') { g1 = 0; g2 = 1; isPlayed = true; isForecast = true; }
      else if (p === 'X') { g1 = 0; g2 = 0; isPlayed = true; isForecast = true; }
    } else if (folketsTipsMode === 2) {
      if (m.status === 'finished') {
        g1 = m.goals1 || 0; g2 = m.goals2 || 0; isPlayed = true;
      } else {
        const p = folketsTips[m.id];
        if (p === '1') { g1=1; g2=0; isPlayed=true; isForecast=true; }
        else if (p === '2') { g1=0; g2=1; isPlayed=true; isForecast=true; }
        else if (p === 'X') { g1=0; g2=0; isPlayed=true; isForecast=true; }
      }
    } else if (m.status === 'finished') {
      g1 = m.goals1 || 0; g2 = m.goals2 || 0; isPlayed = true;
    }

    if (isPlayed) {
      if (isForecast) {
        forecastTeams.add(m.team1);
        forecastTeams.add(m.team2);
      }

      if (stats[m.team1]) {
        stats[m.team1].played++;
        stats[m.team1].gf += g1;
        stats[m.team1].ga += g2;
        stats[m.team1].gd = stats[m.team1].gf - stats[m.team1].ga;
        if (g1 > g2) { stats[m.team1].win++; stats[m.team1].pts += 3; }
        else if (g1 === g2) { stats[m.team1].draw++; stats[m.team1].pts += 1; }
        else { stats[m.team1].loss++; }
      }

      if (stats[m.team2]) {
        stats[m.team2].played++;
        stats[m.team2].gf += g2;
        stats[m.team2].ga += g1;
        stats[m.team2].gd = stats[m.team2].gf - stats[m.team2].ga;
        if (g2 > g1) { stats[m.team2].win++; stats[m.team2].pts += 3; }
        else if (g1 === g2) { stats[m.team2].draw++; stats[m.team2].pts += 1; }
        else { stats[m.team2].loss++; }
      }
    }
  });

  if (folketsTipsMode === 2) {
    forecastTeams.forEach(name => {
      if (stats[name]) stats[name].hasForecast = true;
    });
  }

  return stats;
}
