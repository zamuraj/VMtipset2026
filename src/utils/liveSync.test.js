import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLiveResultsLogic } from './liveSync';

// Mock console.warn and console.error to avoid noise in test output
// and to assert they are called.
const originalWarn = console.warn;
const originalError = console.error;

describe('fetchLiveResultsLogic', () => {
  let mockConsoleWarn;
  let mockConsoleError;
  let updateMatchMock;

  const sampleMatches = [
    { id: 'm1', team1: 'Sverige', team2: 'Norge', goals1: null, goals2: null, status: 'upcoming', minute: null },
    { id: 'm2', team1: 'USA', team2: 'England', goals1: 1, goals2: 1, status: 'live', minute: '45' }
  ];

  beforeEach(() => {
    mockConsoleWarn = vi.fn();
    mockConsoleError = vi.fn();
    console.warn = mockConsoleWarn;
    console.error = mockConsoleError;
    updateMatchMock = vi.fn();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    console.warn = originalWarn;
    console.error = originalError;
    vi.clearAllMocks();
  });

  it('handles 429 Rate Limit error', async () => {
    global.fetch.mockResolvedValueOnce({
      status: 429,
      ok: false
    });

    await fetchLiveResultsLogic('fake_api_key', sampleMatches, updateMatchMock);

    expect(global.fetch).toHaveBeenCalledWith('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': 'fake_api_key' }
    });
    expect(mockConsoleWarn).toHaveBeenCalledWith('Live-sync: API Rate limit nådd. Avvaktar till nästa cykel.');
    expect(updateMatchMock).not.toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('handles non-ok response', async () => {
    global.fetch.mockResolvedValueOnce({
      status: 500,
      ok: false
    });

    await fetchLiveResultsLogic('fake_api_key', sampleMatches, updateMatchMock);

    expect(mockConsoleError).toHaveBeenCalled();
    // The exact error message depends on browser/node, but we can verify it logs something with Live Sync Error
    expect(mockConsoleError.mock.calls[0][0]).toBe('Live Sync Error:');
    expect(updateMatchMock).not.toHaveBeenCalled();
  });

  it('handles network error (fetch throws)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network failure'));

    await fetchLiveResultsLogic('fake_api_key', sampleMatches, updateMatchMock);

    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockConsoleError.mock.calls[0][0]).toBe('Live Sync Error:');
    expect(updateMatchMock).not.toHaveBeenCalled();
  });

  it('successfully parses data and updates matches when state differs', async () => {
    const apiData = {
      matches: [
        {
          homeTeam: { name: 'Sweden' },
          awayTeam: { name: 'Norway' },
          score: { fullTime: { home: 2, away: 1 } },
          status: 'FINISHED'
        },
        {
          homeTeam: { name: 'United States' },
          awayTeam: { name: 'England' },
          score: { fullTime: { home: 1, away: 1 } },
          status: 'IN_PLAY',
          minute: 45
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => apiData
    });

    await fetchLiveResultsLogic('fake_api_key', sampleMatches, updateMatchMock);

    // Should update m1 because it was upcoming and is now finished with 2-1
    expect(updateMatchMock).toHaveBeenCalledWith('m1', {
      goals1: 2,
      goals2: 1,
      status: 'finished',
      minute: null
    });

    // Should NOT update m2 because it's exactly the same
    expect(updateMatchMock).not.toHaveBeenCalledWith('m2', expect.anything());
    expect(updateMatchMock).toHaveBeenCalledTimes(1);
  });

  it('updates live match if goals or status change', async () => {
    const apiData = {
      matches: [
        {
          homeTeam: { name: 'United States' },
          awayTeam: { name: 'England' },
          score: { fullTime: { home: 2, away: 1 } },
          status: 'LIVE',
          minute: 55
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => apiData
    });

    await fetchLiveResultsLogic('fake_api_key', sampleMatches, updateMatchMock);

    // Should update m2 because goals changed
    expect(updateMatchMock).toHaveBeenCalledWith('m2', {
      goals1: 2,
      goals2: 1,
      status: 'live',
      minute: '55'
    });
  });

  it('handles unexpected team names gracefully', async () => {
    const apiData = {
      matches: [
        {
          homeTeam: { name: 'UnknownTeam' },
          awayTeam: { name: 'AnotherUnknown' },
          score: { fullTime: { home: 0, away: 0 } },
          status: 'FINISHED'
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => apiData
    });

    await fetchLiveResultsLogic('fake_api_key', sampleMatches, updateMatchMock);

    expect(updateMatchMock).not.toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });
});
