import { MIN_GROUP_SIZE } from '../../lib/metrics/groups';
import type { GroupStats, Proportion } from '../../lib/types';

export interface RateRow {
  group: string;
  rate: number;
  err: [number, number];
  n: number;
  small: boolean;
  lower: number;
  upper: number;
}

export function toRows(
  groups: readonly GroupStats[],
  pick: (g: GroupStats) => Proportion | undefined = (g) => g.selectionRate,
): RateRow[] {
  return groups
    .map((g) => ({ g, p: pick(g) }))
    .filter(({ p }) => p?.value != null)
    .map(({ g, p }) => ({
      group: g.group,
      rate: p!.value!,
      lower: p!.lower!,
      upper: p!.upper!,
      err: [p!.value! - p!.lower!, p!.upper! - p!.value!] as [number, number],
      n: p!.n,
      small: p!.n < MIN_GROUP_SIZE,
    }));
}

/** Evenly spaced "nice" ticks from 0 (or a negative floor) up to at least `max`. */
export function niceTicks(
  max: number,
  min = 0,
  target = 5,
): { ticks: number[]; domain: [number, number] } {
  const span = Math.max(max - Math.min(min, 0), 1e-6);
  const raw = span / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  const lo = Math.min(0, Math.floor(min / step) * step);
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { ticks, domain: [lo, hi] };
}
