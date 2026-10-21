import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { useI18n } from '../../i18n';
import { PROXY_ASSOCIATION } from '../../lib/ml/deeper';
import type { FeatureInsight } from '../../lib/types';
import { niceTicks } from '../dashboard/rates';

interface Point extends FeatureInsight {
  x: number;
  y: number;
  label: string;
}

function ProxyTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t, f } = useI18n();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Point;
  return (
    <div className="chart-tooltip">
      <strong>{p.feature}</strong>
      <div className="row-item">
        <span>{t('deeper.colAssociation')}</span>
        <span>{f.num(p.cramersV)}</span>
      </div>
      <div className="row-item">
        <span>{t('deeper.colMI')}</span>
        <span>{f.pct(p.mutualInfo)}</span>
      </div>
      <div className="row-item">
        <span>{t('deeper.colImportance')}</span>
        <span>
          {f.pts(p.permutationImportance)} {t('common.points')}
        </span>
      </div>
      {p.isProxy && <div className="warn">◆ {t('deeper.proxyTag')}</div>}
    </div>
  );
}

function Diamond(props: { cx?: number; cy?: number }) {
  const { cx = 0, cy = 0 } = props;
  const r = 7;
  return (
    <path
      d={`M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`}
      fill="var(--series-2)"
      stroke="var(--surface)"
      strokeWidth={2}
    />
  );
}

function Dot(props: { cx?: number; cy?: number }) {
  const { cx = 0, cy = 0 } = props;
  return (
    <circle cx={cx} cy={cy} r={5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
  );
}

/** Association with the sensitive attribute (x) vs. importance for the model (y). */
export function ProxyChart({
  features,
  width,
  ariaLabel,
}: {
  features: FeatureInsight[];
  width?: number;
  ariaLabel: string;
}) {
  const { t, f } = useI18n();
  const byImportance = [...features].sort(
    (a, b) => b.permutationImportance - a.permutationImportance,
  );
  const labelled = new Set([
    ...features.filter((x) => x.isProxy).map((x) => x.feature),
    ...byImportance.slice(0, 3).map((x) => x.feature),
    ...[...features]
      .sort((a, b) => b.cramersV - a.cramersV)
      .slice(0, 2)
      .map((x) => x.feature),
  ]);
  const points: Point[] = features.map((x) => ({
    ...x,
    x: x.cramersV,
    // Negative importance is noise ("no effect"); plot it on the baseline.
    y: Math.max(0, x.permutationImportance),
    label: labelled.has(x.feature) ? x.feature : '',
  }));
  const yAxis = niceTicks(Math.max(0.01, ...points.map((p) => p.y)) * 1.1, 0, 4);
  const proxies = points.filter((p) => p.isProxy);
  const others = points.filter((p) => !p.isProxy);
  const height = 320;

  const chart = (
    <ScatterChart
      margin={{ top: 16, right: 24, bottom: 36, left: 12 }}
      width={width}
      height={width ? height : undefined}
    >
      <CartesianGrid stroke="var(--chart-grid)" />
      <XAxis
        type="number"
        dataKey="x"
        domain={[0, 1]}
        ticks={[0, 0.25, 0.5, 0.75, 1]}
        tickFormatter={(v: number) => f.num(v)}
        stroke="var(--line-strong)"
        label={{
          value: t('deeper.proxyAxisX'),
          position: 'insideBottom',
          offset: -22,
          fill: 'var(--ink-2)',
          fontSize: 12,
        }}
      />
      <YAxis
        type="number"
        dataKey="y"
        domain={yAxis.domain}
        ticks={yAxis.ticks}
        tickFormatter={(v: number) => f.pts(v)}
        stroke="var(--line-strong)"
        width={44}
        label={{
          value: t('deeper.proxyAxisY'),
          angle: -90,
          position: 'insideLeft',
          offset: 4,
          fill: 'var(--ink-2)',
          fontSize: 12,
          dy: 90,
        }}
      />
      <ReferenceLine x={PROXY_ASSOCIATION} stroke="var(--line-strong)" strokeDasharray="4 4" />
      <Tooltip
        content={<ProxyTooltip />}
        cursor={{ strokeDasharray: '3 3' }}
        isAnimationActive={false}
      />
      <Scatter data={others} shape={<Dot />} isAnimationActive={false}>
        <LabelList dataKey="label" position="right" fill="var(--ink-2)" fontSize={11} />
      </Scatter>
      <Scatter data={proxies} shape={<Diamond />} isAnimationActive={false}>
        <LabelList
          dataKey="label"
          position="right"
          fill="var(--ink)"
          fontSize={12}
          fontWeight={600}
        />
      </Scatter>
    </ScatterChart>
  );

  return (
    <div>
      <div role="img" aria-label={ariaLabel}>
        {width ? (
          chart
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {chart}
          </ResponsiveContainer>
        )}
      </div>
      <ul className="legend">
        <li>
          <svg width="14" height="14" aria-hidden="true">
            <path d="M7 0L14 7L7 14L0 7Z" fill="var(--series-2)" />
          </svg>
          {t('deeper.proxyTag')}
        </li>
        <li>
          <svg width="14" height="14" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill="var(--series-1)" />
          </svg>
          {t('deeper.colFeature')}
        </li>
      </ul>
    </div>
  );
}
