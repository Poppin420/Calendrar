import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { useI18n } from '../../i18n';
import { niceTicks, type RateRow } from './rates';

function RateTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t, f } = useI18n();
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as RateRow;
  return (
    <div className="chart-tooltip">
      <strong>{row.group}</strong>
      <div className="row-item">
        <span>{t('dashboard.colRate')}</span>
        <span>{f.pct(row.rate)}</span>
      </div>
      <div className="row-item">
        <span>{t('common.ci')}</span>
        <span>
          {f.pct(row.lower)} – {f.pct(row.upper)}
        </span>
      </div>
      <div className="row-item">
        <span>{t('dashboard.colN')}</span>
        <span>{f.int(row.n)}</span>
      </div>
      {row.small && <div className="warn">⚠ {t('dashboard.smallGroup')}</div>}
    </div>
  );
}

function longestLabel(rows: RateRow[]) {
  return rows.reduce((m, r) => Math.max(m, r.group.length), 0);
}

/**
 * Horizontal bars of a rate per group with 95% CI whiskers and an optional
 * four-fifths reference line. Pass `width` for a fixed-size (print) chart.
 */
export function RatesChart({
  rows,
  referenceValue,
  width,
  ariaLabel,
}: {
  rows: RateRow[];
  referenceValue?: number | null;
  width?: number;
  ariaLabel: string;
}) {
  const { t, f } = useI18n();
  const height = Math.max(140, rows.length * 44 + 56);
  const yWidth = Math.min(180, Math.max(70, longestLabel(rows) * 7.5 + 16));
  const maxUpper = Math.max(...rows.map((r) => r.upper), referenceValue ?? 0, 0.05);
  const { ticks, domain } = niceTicks(Math.min(1, maxUpper * 1.05));

  const chart = (
    <BarChart
      data={rows}
      layout="vertical"
      margin={{ top: 22, right: 24, bottom: 8, left: 4 }}
      width={width}
      height={width ? height : undefined}
      barCategoryGap="28%"
      accessibilityLayer
    >
      <defs>
        <pattern
          id="hatch-small"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" fill="var(--series-1)" opacity="0.35" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--series-1)" strokeWidth="3" />
        </pattern>
      </defs>
      <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
      <XAxis
        type="number"
        domain={domain}
        ticks={ticks}
        tickFormatter={(v: number) => f.pct(v, 0)}
        stroke="var(--line-strong)"
        tickLine={false}
      />
      <YAxis
        type="category"
        dataKey="group"
        width={yWidth}
        stroke="var(--line-strong)"
        tickLine={false}
        tickFormatter={(g: string) => {
          const row = rows.find((r) => r.group === g);
          const label = g.length > 24 ? `${g.slice(0, 23)}…` : g;
          return row?.small ? `⚠ ${label}` : label;
        }}
      />
      <Tooltip
        content={<RateTooltip />}
        cursor={{ fill: 'var(--surface-2)' }}
        isAnimationActive={false}
      />
      {referenceValue != null && referenceValue > 0 && (
        <ReferenceLine
          x={referenceValue}
          stroke="var(--concern-mark)"
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={{
            value: t('dashboard.fourFifthsLine'),
            position: 'top',
            fill: 'var(--ink-3)',
            fontSize: 11,
          }}
        />
      )}
      <Bar dataKey="rate" radius={[0, 4, 4, 0]} isAnimationActive={false} maxBarSize={28}>
        {rows.map((r) => (
          <Cell key={r.group} fill={r.small ? 'url(#hatch-small)' : 'var(--series-1)'} />
        ))}
        <ErrorBar dataKey="err" direction="x" width={8} stroke="var(--ink)" strokeWidth={1.5} />
      </Bar>
    </BarChart>
  );

  return (
    <div role="img" aria-label={ariaLabel}>
      {width ? (
        chart
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {chart}
        </ResponsiveContainer>
      )}
    </div>
  );
}
