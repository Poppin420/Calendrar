import { useI18n } from '../../i18n';
import { MIN_GROUP_SIZE } from '../../lib/metrics/groups';
import type { IntersectionalResult } from '../../lib/types';

const STEPS = 7;

/** Selection rate for every combination of two attributes, as an accessible table. */
export function Heatmap({ data }: { data: IntersectionalResult }) {
  const { t, f } = useI18n();
  const rates = data.cells
    .map((c) => c.stats.selectionRate.value)
    .filter((v): v is number => v !== null);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const step = (v: number) =>
    max === min ? 3 : Math.min(STEPS - 1, Math.floor(((v - min) / (max - min)) * STEPS));
  const cell = (r: string, c: string) =>
    data.cells.find((x) => x.rowGroup === r && x.colGroup === c)!;

  return (
    <div>
      <div
        className="heatmap-scroll"
        tabIndex={0}
        role="region"
        aria-label={t('dashboard.heatmapTitle', { a: data.rowAttribute, b: data.colAttribute })}
      >
        <table className="heatmap-table">
          <caption className="visually-hidden">
            {t('dashboard.heatmapTitle', { a: data.rowAttribute, b: data.colAttribute })}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="hm-corner">
                {data.rowAttribute} ↓ · {data.colAttribute} →
              </th>
              {data.colGroups.map((c) => (
                <th key={c} scope="col" className="hm-col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rowGroups.map((r) => (
              <tr key={r}>
                <th scope="row" className="hm-row">
                  {r}
                </th>
                {data.colGroups.map((c) => {
                  const s = cell(r, c).stats;
                  const p = s.selectionRate;
                  if (s.n === 0 || p.value === null) {
                    return (
                      <td key={c}>
                        <div className="hm-cell empty">{t('dashboard.heatmapEmpty')}</div>
                      </td>
                    );
                  }
                  const small = s.n < MIN_GROUP_SIZE;
                  const ci = `${t('common.ci')}: ${f.pct(p.lower)}–${f.pct(p.upper)}`;
                  return (
                    <td key={c}>
                      <div
                        className={`hm-cell seq-${step(p.value)}${small ? ' small' : ''}`}
                        title={ci}
                      >
                        <span className="v">
                          {small && <span aria-hidden="true">⚠ </span>}
                          {f.pct(p.value)}
                        </span>
                        <span className="n">n = {f.int(s.n)}</span>
                        <span className="visually-hidden">
                          {ci}. {small ? t('dashboard.smallGroup') : ''}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hm-legend" aria-hidden="true">
        <span>
          {t('dashboard.heatmapLegendLow')} ({f.pct(min, 0)})
        </span>
        <span className="ramp">
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={`seq-${i}`} />
          ))}
        </span>
        <span>
          {t('dashboard.heatmapLegendHigh')} ({f.pct(max, 0)})
        </span>
      </div>
    </div>
  );
}
