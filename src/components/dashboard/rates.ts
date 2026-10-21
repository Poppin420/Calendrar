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
