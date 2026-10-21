import { describe, expect, it } from 'vitest';
import type { AuditConfig, Dataset } from '../types';
import { prepare, runAudit } from './audit';

function makeDataset(): Dataset {
  const rows: (string | null)[][] = [];
  // 100 men: 60 hired. 100 women: 30 hired. Ages alternate 22 / 45.
  for (let i = 0; i < 100; i++)
    rows.push(['M', i % 2 ? '22' : '45', i < 60 ? 'yes' : 'no', i < 55 ? 'yes' : 'no']);
  for (let i = 0; i < 100; i++)
    rows.push(['F', i % 2 ? '22' : '45', i < 30 ? 'yes' : 'no', i < 50 ? 'yes' : 'no']);
  rows.push([null, '30', 'yes', 'yes']); // missing sensitive value → dropped
  rows.push(['F', '30', null, 'no']); // missing decision → dropped
  return { name: 't', columns: ['sex', 'age', 'hired', 'performed'], rows };
}

const base: AuditConfig = {
  decisionColumn: 'hired',
  favorableValues: ['yes'],
  sensitive: [{ column: 'sex' }],
};

describe('prepare', () => {
  it('drops incomplete rows and binarises outcomes', () => {
    const p = prepare(makeDataset(), base);
    expect(p.dropped).toBe(2);
    expect(p.pred.length).toBe(200);
    expect(p.pred.reduce((s, x) => s + x, 0)).toBe(90);
  });
});

describe('runAudit', () => {
  it('computes per-group selection rates and flags disparate impact', () => {
    const r = runAudit(makeDataset(), base, new Date('2026-01-01'));
    expect(r.rowCount).toBe(200);
    expect(r.hasGroundTruth).toBe(false);
    const sex = r.attributes[0];
    expect(sex.groups.map((g) => [g.group, g.selectionRate.value])).toEqual([
      ['F', 0.3],
      ['M', 0.6],
    ]);
    const di = sex.metrics.find((m) => m.key === 'disparateImpact')!;
    expect(di.ratio?.value).toBeCloseTo(0.5);
    expect(di.verdict).toBe('concern');
    expect(r.generatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('adds error metrics with ground truth', () => {
    const r = runAudit(makeDataset(), {
      ...base,
      groundTruthColumn: 'performed',
      groundTruthFavorableValues: ['yes'],
    });
    expect(r.hasGroundTruth).toBe(true);
    expect(r.attributes[0].metrics).toHaveLength(6);
    const women = r.attributes[0].groups.find((g) => g.group === 'F')!;
    // Women: hired = first 30, performed = first 50 → TP 30, FN 20, FP 0, TN 50
    expect(women.confusion).toEqual({ tp: 30, fp: 0, tn: 50, fn: 20 });
  });

  it('builds the intersectional heatmap with binned age', () => {
    const r = runAudit(makeDataset(), {
      ...base,
      sensitive: [{ column: 'sex' }, { column: 'age', binEdges: [25], integer: true }],
    });
    expect(r.attributes).toHaveLength(3);
    expect(r.attributes[2].attribute).toBe('sex × age');
    expect(r.intersectional?.colGroups).toEqual(['< 25', '≥ 25']);
    expect(r.intersectional?.cells).toHaveLength(4);
    const cell = r.intersectional!.cells.find((c) => c.rowGroup === 'M' && c.colGroup === '≥ 25')!;
    expect(cell.stats.n).toBe(50);
    // Even rows (age 45) of men: indices 0,2,..,58 hired → 30 of 50
    expect(cell.stats.selectionRate.value).toBeCloseTo(0.6);
  });

  it('detects a single-class decision column', () => {
    const ds = makeDataset();
    const r = runAudit(ds, { ...base, favorableValues: ['maybe'] });
    expect(r.singleClass).toBe(true);
    expect(r.attributes[0].metrics[0].verdict).toBe('na');
  });

  it('throws on unknown columns', () => {
    expect(() => runAudit(makeDataset(), { ...base, decisionColumn: 'nope' })).toThrow();
  });
});
