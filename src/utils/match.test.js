import { describe, it, expect } from 'vitest';
import { get1X2 } from './match';

describe('get1X2', () => {
  it('returns "1" when team 1 scores more goals than team 2', () => {
    expect(get1X2(2, 1)).toBe('1');
    expect(get1X2(1, 0)).toBe('1');
    expect(get1X2(5, 2)).toBe('1');
  });

  it('returns "2" when team 2 scores more goals than team 1', () => {
    expect(get1X2(0, 1)).toBe('2');
    expect(get1X2(1, 2)).toBe('2');
    expect(get1X2(2, 5)).toBe('2');
  });

  it('returns "X" when both teams score the same number of goals', () => {
    expect(get1X2(0, 0)).toBe('X');
    expect(get1X2(1, 1)).toBe('X');
    expect(get1X2(3, 3)).toBe('X');
  });

  it('returns null if the first parameter is null', () => {
    expect(get1X2(null, 1)).toBeNull();
    expect(get1X2(null, 0)).toBeNull();
  });

  it('returns null if the second parameter is null', () => {
    expect(get1X2(1, null)).toBeNull();
    expect(get1X2(0, null)).toBeNull();
  });

  it('returns null if both parameters are null', () => {
    expect(get1X2(null, null)).toBeNull();
  });
});
