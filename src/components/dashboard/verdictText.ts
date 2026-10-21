import type { Formatters } from '../../i18n/translate';
import type { MessageKey, Params } from '../../i18n/types';
import type { MetricResult } from '../../lib/types';

type T = (key: MessageKey, params?: Params) => string;

export interface MetricText {
  /** What happened, in plain language (empty when not computable). */
  main: string;
  /** What it means against the threshold. */
  verdict: string;
  /** The uncertainty, in one sentence. */
  interval: string;
  /** Headline number. */
  figure: string;
  figureUnit: string;
}

const RATIO_METRICS = new Set(['disparateImpact']);

/** Turn a metric result into the plain-language sentences shown to users. */
export function metricText(m: MetricResult, t: T, f: Formatters): MetricText {
  const isRatio = RATIO_METRICS.has(m.key);
  const params = {
    worst: m.worstGroup ?? '',
    best: m.bestGroup ?? '',
    worstRate: f.pct(m.worstValue),
    bestRate: f.pct(m.bestValue),
    ratio: f.pct(m.ratio?.value ?? null, 0),
    gap: f.pts(m.difference.value),
  };

  let mainKey: MessageKey = `sentences.${m.key}` as MessageKey;
  if (m.key === 'equalizedOdds') {
    mainKey = m.component === 'fpr' ? 'sentences.equalizedOddsFpr' : 'sentences.equalizedOddsTpr';
  }
  const computable = m.worstGroup !== null && !(isRatio && m.ratio?.value == null);
  const main = computable ? t(mainKey, params) : '';

  const verdictKey: MessageKey =
    m.verdict === 'insufficient'
      ? 'sentences.insufficient'
      : m.verdict === 'na'
        ? 'sentences.na'
        : isRatio
          ? (`sentences.ratio${cap(m.verdict)}` as MessageKey)
          : (`sentences.gap${cap(m.verdict)}` as MessageKey);

  let interval = '';
  if (computable) {
    interval = isRatio
      ? t('sentences.intervalRatio', {
          lo: f.num(m.ratio?.lower ?? null),
          hi: f.num(m.ratio?.upper ?? null),
        })
      : t('sentences.intervalGap', {
          lo: f.pts(m.difference.lower),
          hi: f.pts(m.difference.upper),
        });
  }

  return {
    main,
    verdict: t(verdictKey),
    interval,
    figure: !computable ? '–' : isRatio ? f.num(m.ratio?.value ?? null) : f.pts(m.difference.value),
    figureUnit: !computable
      ? ''
      : isRatio
        ? `≥ ${f.num(m.threshold)}`
        : `${t('common.points')} · ≤ ${f.pts(m.threshold, 0)}`,
  };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
