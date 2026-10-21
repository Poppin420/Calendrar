/**
 * Heuristics that pre-fill the column mapping for an uploaded file.
 * They only suggest; the user confirms every choice.
 */

import type { ColumnProfile } from './types';

const DECISION =
  /(hired|hire|approv|decision|outcome|accept|grant|admit|select|offer|pass|result|label|target|loan|credit|πρόσλ|απόφ|έγκρ|εγκρ|αποτέλ)/i;
const SENSITIVE =
  /(sex|gender|φύλο|race|ethnic|εθν|age|ηλικ|nation|religio|θρήσκ|disab|αναπηρ|marital|origin|καταγ)/i;
const TRUTH = /(actual|truth|true_|real|observed|performance|repaid|default|outcome_true|πραγματ)/i;
const FAVORABLE =
  /^(1|yes|y|true|approved?|accept(ed)?|hired|granted|pass(ed)?|good|positive|admitted|selected|ναι|εγκρ\S*|θετικ\S*|>50k)$/i;

function usable(p: ColumnProfile) {
  return p.kind !== 'constant' && p.kind !== 'identifier';
}

export function guessDecision(profiles: readonly ColumnProfile[]): string | undefined {
  const binary = profiles.filter((p) => p.kind === 'binary');
  return (
    binary.find((p) => DECISION.test(p.name) && !TRUTH.test(p.name))?.name ??
    binary.filter((p) => !SENSITIVE.test(p.name)).at(-1)?.name ??
    binary.at(-1)?.name
  );
}

export function guessFavorable(profile: ColumnProfile | undefined): string[] {
  if (!profile) return [];
  const match = profile.topValues.find((v) => FAVORABLE.test(v.value.trim()));
  if (match) return [match.value];
  // Fall back to the less frequent value of a binary column (often the "selected" one).
  if (profile.kind === 'binary' && profile.topValues.length === 2)
    return [profile.topValues[1].value];
  return [];
}

export function guessSensitive(
  profiles: readonly ColumnProfile[],
  exclude: readonly string[],
): string[] {
  return profiles
    .filter((p) => usable(p) && !exclude.includes(p.name) && SENSITIVE.test(p.name))
    .filter((p) => p.kind === 'numeric' || p.unique <= 30)
    .slice(0, 1)
    .map((p) => p.name);
}

export function guessTruth(
  profiles: readonly ColumnProfile[],
  exclude: readonly string[],
): string | undefined {
  return profiles.find(
    (p) => p.kind === 'binary' && !exclude.includes(p.name) && TRUTH.test(p.name),
  )?.name;
}

/** Columns that can serve as a sensitive attribute. */
export function sensitiveCandidates(profiles: readonly ColumnProfile[]): ColumnProfile[] {
  return profiles.filter((p) => usable(p) && (p.kind === 'numeric' || p.unique <= 50));
}
