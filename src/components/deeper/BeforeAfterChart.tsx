import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useI18n } from '../../i18n';
import type { ModelEvaluation } from '../../lib/types';
import { niceTicks } from '../dashboard/rates';

/** Model's favorable rate per group before and after reweighing. */
export function BeforeAfterChart({
  before,
  after,
  width,
  ariaLabel,
}: {
  before: ModelEvaluation;
  after: ModelEvaluation;
  width?: number;
  ariaLabel: string;
}) {
  const { t, f } = useI18n();
  const rows = before.groups.map((g) => ({
    group: g.group,
    before: g.selectionRate.value ?? 0,
    after: after.groups.find((x) => x.group === g.group)?.selectionRate.value ?? 0,
  }));
  const max = Math.max(0.05, ...rows.flatMap((r) => [r.before, r.after]));
  const { ticks, domain } = niceTicks(Math.min(1, max * 1.12));
  const height = Math.max(160, rows.length * 64 + 40);
  const yWidth = Math.min(
    180,
    Math.max(70, Math.max(...rows.map((r) => r.group.length)) * 7.5 + 16),
  );
  const fmt = (v: unknown) => f.pct(typeof v === 'number' ? v : null);

  const chart = (
    <BarChart
      data={rows}
      layout="vertical"
      width={width}
      height={width ? height : undefined}
      margin={{ top: 8, right: 56, bottom: 8, left: 4 }}
      barGap={2}
      barCategoryGap="24%"
    >
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
      />
      <Tooltip
        formatter={(v: number, name: string) => [
          f.pct(v),
          name === 'before' ? t('deeper.before') : t('deeper.after'),
        ]}
        contentStyle={{
          background: 'var(--surface)',
          border: '1px solid var(--line-strong)',
          borderRadius: 6,
          color: 'var(--ink)',
        }}
        cursor={{ fill: 'var(--surface-2)' }}
        isAnimationActive={false}
      />
      <Bar
        dataKey="before"
        fill="var(--series-1)"
        radius={[0, 4, 4, 0]}
        maxBarSize={18}
        isAnimationActive={false}
      >
        <LabelList
          dataKey="before"
          position="right"
          formatter={fmt}
          fill="var(--ink-2)"
          fontSize={11}
        />
      </Bar>
      <Bar
        dataKey="after"
        fill="var(--series-2)"
        radius={[0, 4, 4, 0]}
        maxBarSize={18}
        isAnimationActive={false}
      >
        <LabelList
          dataKey="after"
          position="right"
          formatter={fmt}
          fill="var(--ink-2)"
          fontSize={11}
        />
      </Bar>
    </BarChart>
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
          <span className="swatch" style={{ background: 'var(--series-1)' }} />
          {t('deeper.before')}
        </li>
        <li>
          <span className="swatch" style={{ background: 'var(--series-2)' }} />
          {t('deeper.after')}
        </li>
      </ul>
    </div>
  );
}
