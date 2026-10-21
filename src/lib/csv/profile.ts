/**
 * Column profiling and data-quality checks for an uploaded table.
 */

import { toNumber } from '../binning';
import { MIN_GROUP_SIZE } from '../metrics/groups';
import type {
  Cell,
  ColumnKind,
  ColumnProfile,
  DataWarning,
  Dataset,
  DatasetSummary,
} from '../types';

const MISSING_TOKENS = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', '?', '#n/a']);

/** Normalise a raw CSV value: trims it and maps common "missing" tokens to null. */
export function normaliseCell(raw: unknown): Cell {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  return MISSING_TOKENS.has(s.toLowerCase()) ? null : s;
}

export function profileColumn(name: string, values: readonly Cell[]): ColumnProfile {
  const counts = new Map<string, number>();
  let missing = 0;
  let numeric = 0;
  let integer = true;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const v of values) {
    if (v === null) {
      missing++;
      continue;
    }
    counts.set(v, (counts.get(v) ?? 0) + 1);
    const x = toNumber(v);
    if (x !== null) {
      numeric++;
      sum += x;
      if (x < min) min = x;
      if (x > max) max = x;
      if (!Number.isInteger(x)) integer = false;
    }
  }
  const present = values.length - missing;
  const unique = counts.size;
  const topValues = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([value, count]) => ({ value, count }));

  let kind: ColumnKind;
  const isNumeric = present > 0 && numeric / present >= 0.98;
  if (unique <= 1) kind = 'constant';
  else if (unique === 2) kind = 'binary';
  else if (isNumeric) {
    kind =
      integer && unique === present && present > 50 && /(^|[_\s-])id$|^id([_\s-]|$)/i.test(name)
        ? 'identifier'
        : 'numeric';
  } else if (unique > 50 && unique / present > 0.9) kind = 'identifier';
  else kind = 'categorical';

  const profile: ColumnProfile = { name, kind, missing, unique, topValues };
  if (isNumeric && numeric > 0) {
    profile.min = min;
    profile.max = max;
    profile.mean = sum / numeric;
  }
  return profile;
}

/** True when a numeric column only contains whole numbers. */
export function isIntegerColumn(values: readonly Cell[]): boolean {
  for (const v of values) {
    if (v === null) continue;
    const x = toNumber(v);
    if (x !== null && !Number.isInteger(x)) return false;
  }
  return true;
}

export function column(ds: Dataset, name: string): Cell[] {
  const j = ds.columns.indexOf(name);
  if (j < 0) throw new Error(`Unknown column: ${name}`);
  return ds.rows.map((r) => r[j] ?? null);
}

export function summarise(ds: Dataset, raggedRows = 0): DatasetSummary {
  const profiles = ds.columns.map((c) => profileColumn(c, column(ds, c)));
  const warnings: DataWarning[] = [];
  const n = ds.rows.length;
  if (n < 100) warnings.push({ code: 'fewRows', value: n });
  if (raggedRows > 0) warnings.push({ code: 'raggedRows', value: raggedRows });
  for (const p of profiles) {
    if (p.kind === 'constant') warnings.push({ code: 'constantColumn', column: p.name });
    if (p.kind === 'identifier') warnings.push({ code: 'identifierColumn', column: p.name });
    if (p.missing > 0) {
      warnings.push({
        code: 'missingValues',
        column: p.name,
        value: Math.round((1000 * p.missing) / Math.max(1, n)) / 10,
      });
    }
    if ((p.kind === 'categorical' || p.kind === 'binary') && p.unique <= 20) {
      const tiny = p.topValues.filter((v) => v.count < MIN_GROUP_SIZE);
      if (tiny.length > 0 && n >= 100) {
        warnings.push({
          code: 'tinyGroup',
          column: p.name,
          value: tiny.length,
          detail: tiny.map((t) => t.value).join(', '),
        });
      }
    }
  }
  return {
    name: ds.name,
    rowCount: n,
    columns: ds.columns,
    preview: ds.rows.slice(0, 8),
    profiles,
    warnings,
  };
}
