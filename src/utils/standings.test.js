import { describe, it, expect } from 'vitest';
import { calculateGroupStandings } from './standings';

describe('calculateGroupStandings', () => {
  const TEAMS = {
    'Team A': { group: 'Group A' },
    'Team B': { group: 'Group A' },
    'Team C': { group: 'Group B' },
    'Team D': { group: 'Group B' },
  };

  it('should calculate standings correctly for real results (folketsTipsMode === 0)', () => {
    const matches = [
      { id: '1', team1: 'Team A', team2: 'Team B', group: 'Group A', status: 'finished', goals1: 2, goals2: 1 },
      { id: '2', team1: 'Team C', team2: 'Team D', group: 'Group B', status: 'finished', goals1: 1, goals2: 1 },
      { id: '3', team1: 'Team A', team2: 'Team C', group: 'Group A', status: 'scheduled', goals1: null, goals2: null }, // Unfinished
    ];
    const folketsTipsMode = 0;
    const folketsTips = {};

    const standings = calculateGroupStandings(TEAMS, matches, folketsTipsMode, folketsTips);

    // Team A won
    expect(standings['Team A'].played).toBe(1);
    expect(standings['Team A'].win).toBe(1);
    expect(standings['Team A'].pts).toBe(3);
    expect(standings['Team A'].gf).toBe(2);
    expect(standings['Team A'].ga).toBe(1);
    expect(standings['Team A'].gd).toBe(1);

    // Team B lost
    expect(standings['Team B'].played).toBe(1);
    expect(standings['Team B'].loss).toBe(1);
    expect(standings['Team B'].pts).toBe(0);

    // Team C and D drew
    expect(standings['Team C'].played).toBe(1);
    expect(standings['Team C'].draw).toBe(1);
    expect(standings['Team C'].pts).toBe(1);

    expect(standings['Team D'].played).toBe(1);
    expect(standings['Team D'].draw).toBe(1);
    expect(standings['Team D'].pts).toBe(1);
  });

  it('should calculate standings correctly for folkets tips only (folketsTipsMode === 1)', () => {
    const matches = [
      { id: '1', team1: 'Team A', team2: 'Team B', group: 'Group A', status: 'scheduled' }, // folkets tips says '1'
      { id: '2', team1: 'Team C', team2: 'Team D', group: 'Group B', status: 'scheduled' }, // folkets tips says '2'
      { id: '3', team1: 'Team A', team2: 'Team C', group: 'Group A', status: 'finished', goals1: 10, goals2: 0 }, // Should ignore real results
    ];
    const folketsTipsMode = 1;
    const folketsTips = {
      '1': '1', // Home win (1-0)
      '2': '2', // Away win (0-1)
      '3': 'X', // Draw (0-0)
    };

    const standings = calculateGroupStandings(TEAMS, matches, folketsTipsMode, folketsTips);

    expect(standings['Team A'].played).toBe(2);
    expect(standings['Team A'].pts).toBe(4); // 3 for win, 1 for draw
    expect(standings['Team A'].gf).toBe(1);

    expect(standings['Team B'].played).toBe(1);
    expect(standings['Team B'].pts).toBe(0);

    expect(standings['Team C'].played).toBe(2);
    expect(standings['Team C'].pts).toBe(1); // 0 for loss, 1 for draw

    expect(standings['Team D'].played).toBe(1);
    expect(standings['Team D'].pts).toBe(3); // 3 for win
  });

  it('should calculate standings correctly for hybrid mode (folketsTipsMode === 2)', () => {
    const matches = [
      { id: '1', team1: 'Team A', team2: 'Team B', group: 'Group A', status: 'finished', goals1: 3, goals2: 0 }, // Real result
      { id: '2', team1: 'Team C', team2: 'Team D', group: 'Group B', status: 'scheduled' }, // Folkets tips '1'
      { id: '3', team1: 'Team A', team2: 'Team C', group: 'Group A', status: 'scheduled' }, // Folkets tips 'X'
    ];
    const folketsTipsMode = 2;
    const folketsTips = {
      '1': '2', // Should be ignored because status is finished
      '2': '1', // Home win (1-0)
      '3': 'X', // Draw (0-0)
    };

    const standings = calculateGroupStandings(TEAMS, matches, folketsTipsMode, folketsTips);

    // Team A: 1 real win, 1 forecast draw
    expect(standings['Team A'].played).toBe(2);
    expect(standings['Team A'].pts).toBe(4);
    expect(standings['Team A'].gf).toBe(3);
    expect(standings['Team A'].hasForecast).toBe(true);

    // Team B: 1 real loss
    expect(standings['Team B'].played).toBe(1);
    expect(standings['Team B'].pts).toBe(0);
    expect(standings['Team B'].hasForecast).toBe(false);

    // Team C: 1 forecast win, 1 forecast draw
    expect(standings['Team C'].played).toBe(2);
    expect(standings['Team C'].pts).toBe(4);
    expect(standings['Team C'].gf).toBe(1);
    expect(standings['Team C'].hasForecast).toBe(true);
  });
});
