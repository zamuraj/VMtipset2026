import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../app.jsx';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((_, callback) => {
    callback({ docs: [], exists: () => false, data: () => ({}) });
    return vi.fn();
  }),
  doc: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn()
}));

describe('App LiveSync Error Handling', () => {
  let originalFetch;
  let consoleErrorSpy;

  beforeEach(() => {
    // Mock local storage to set admin user
    const mockAdminUser = { email: 'admin@test.com', isAdmin: true };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'vmt_login_session') {
        return JSON.stringify(mockAdminUser);
      }
      return null;
    });

    originalFetch = global.fetch;
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('handles and logs fetchLiveResults API error correctly', async () => {
    render(<App />);

    // Wait for the Admin button (the Settings icon)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Admin/i })).toBeInTheDocument();
    });

    const adminTab = screen.getByRole('button', { name: /Admin/i });
    fireEvent.click(adminTab);

    // Wait for the STARTA LIVE-SYNK button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /STARTA LIVE-SYNK/i })).toBeInTheDocument();
    });

    // Click the STARTA LIVE-SYNK button
    const liveSyncBtn = screen.getByRole('button', { name: /STARTA LIVE-SYNK/i });
    fireEvent.click(liveSyncBtn);

    // Assert that console.error was called with the expected error message
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Live Sync Error:',
        expect.any(Error)
      );
    });
  });
});
