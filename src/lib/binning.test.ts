import { describe, expect, it } from 'vitest';
import { binIndex, binLabels, groupOf, niceRound, suggestBins, toNumber } from './binning';

describe('toNumber', () => {
  it('parses numbers, decimal commas and rejects text', () => {
    expect(toNumber('42')).toBe(42);
    expect(toNumber(' 3,5 ')).toBe(3.5);
    expect(toNumber('abc')).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber('')).toBeNull();
  });
});

describe('binning', () => {
  it('labels integer bins as closed ranges', () => {
    expect(binLabels([25, 40, 60], true)).toEqual(['< 25', '25–39', '40–59', '≥ 60']);
  });
  it('labels non-integer bins as half-open ranges', () => {
    expect(binLabels([1.5, 3], false)).toEqual(['< 1.5', '1.5 – < 3', '≥ 3']);
  });
  it('puts edge values in the upper bin', () => {
    expect(binIndex(24, [25, 40])).toBe(0);
    expect(binIndex(25, [25, 40])).toBe(1);
    expect(binIndex(40, [25, 40])).toBe(2);
  });
  it('maps cells to groups', () => {
    const spec = { column: 'age', binEdges: [25, 40], integer: true };
    expect(groupOf('30', spec)).toBe('25–39');
    expect(groupOf(null, spec)).toBeNull();
    expect(groupOf('n/a', spec)).toBeNull();
    expect(groupOf(' F ', { column: 'sex' })).toBe('F');
  });
  it('suggests age bands for age columns', () => {
    expect(suggestBins('Age', [18, 30, 70])).toEqual([25, 40, 60]);
    expect(suggestBins('age', [30, 35, 50])).toEqual([40]);
  });
  it('suggests rounded tertiles for other columns', () => {
    const v = Array.from({ length: 300 }, (_, i) => i * 10);
    const edges = suggestBins('income', v);
    expect(edges).toHaveLength(2);
    expect(edges.every((e) => e === niceRound(e))).toBe(true);
  });
  it('rounds to nice numbers', () => {
    expect(niceRound(1234)).toBe(1000);
    expect(niceRound(0.031)).toBeCloseTo(0.025);
    expect(niceRound(0)).toBe(0);
  });
});
