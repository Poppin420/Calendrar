import type { Formatters } from '../../i18n/translate';
import type { MessageKey, Params } from '../../i18n/types';
import type { DeeperResult } from '../../lib/types';

/** One sentence that makes the fairness / accuracy trade-off explicit. */
export function tradeoffText(
  result: DeeperResult,
  t: (k: MessageKey, p?: Params) => string,
  f: Formatters,
): string {
  return t('deeper.tradeoff', {
    before: f.num(result.baseline.disparateImpact.ratio?.value ?? null),
    after: f.num(result.reweighed.disparateImpact.ratio?.value ?? null),
    accDelta: f.pts(result.reweighed.accuracy - result.baseline.accuracy),
  });
}
