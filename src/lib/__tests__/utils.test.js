import { describe, it, expect } from 'vitest';
import { formatRupiah } from '../utils.js';

describe('formatRupiah', () => {
  it('formats a regular price correctly', () => {
    expect(formatRupiah(65000)).toBe('Rp 65.000');
  });

  it('formats zero as "Rp 0"', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });

  it('handles null input gracefully (fallback to 0)', () => {
    expect(formatRupiah(null)).toBe('Rp 0');
  });

  it('handles undefined input gracefully (fallback to 0)', () => {
    expect(formatRupiah(undefined)).toBe('Rp 0');
  });

  it('rounds floating point numbers', () => {
    expect(formatRupiah(25000.7)).toBe('Rp 25.001');
    expect(formatRupiah(25000.3)).toBe('Rp 25.000');
  });

  it('formats large numbers correctly', () => {
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
  });

  it('formats small numbers correctly', () => {
    expect(formatRupiah(500)).toBe('Rp 500');
  });
});
