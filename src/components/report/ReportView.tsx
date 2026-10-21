import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n';
import type { AttributeAudit, AuditConfig, AuditResult, MetricResult } from '../../lib/types';
import { useAudit } from '../AuditContext';
import { GroupTable } from '../dashboard/GroupTable';
import { Heatmap } from '../dashboard/Heatmap';
import { RatesChart } from '../dashboard/RatesChart';
import { toRows } from '../dashboard/rates';
import { metricText } from '../dashboard/verdictText';
import { MitigationTable } from '../deeper/DeeperPanel';
import { tradeoffText } from '../deeper/deeperText';
import { LogoMark } from '../ui/Logo';
import { VerdictBadge } from '../ui/Verdict';

const CHART_WIDTH = 640;
const ORDER: Record<string, number> = {
  concern: 0,
  inconclusive: 1,
  insufficient: 2,
  ok: 3,
  na: 4,
};

function Finding({ metric }: { metric: MetricResult }) {
  const { t, f } = useI18n();
  const text = metricText(metric, t, f);
  return (
    <div className="report-finding">
      <div>
        <VerdictBadge verdict={metric.verdict} />
      </div>
      <p>
        <strong>{t(`metricNames.${metric.key}`)}.</strong> {text.main} {text.verdict}
      </p>
    </div>
  );
}

function compactInterval(m: MetricResult, f: ReturnType<typeof useI18n>['f']): string {
  if (m.worstGroup === null) return '–';
  if (m.key === 'disparateImpact')
    return `${f.num(m.ratio?.lower ?? null)} – ${f.num(m.ratio?.upper ?? null)}`;
  return `${f.pts(m.difference.lower)} – ${f.pts(m.difference.upper)}`;
}

function MetricsTable({ audit }: { audit: AttributeAudit }) {
  const { t, f } = useI18n();
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">{t('deeper.metric')}</th>
          <th scope="col" className="num">
            {t('dashboard.lowest')}
          </th>
          <th scope="col" className="num">
            {t('dashboard.highest')}
          </th>
          <th scope="col" className="num">
            {t('report.valueCol')}
          </th>
          <th scope="col">{t('common.ci')}</th>
          <th scope="col">{t('report.verdictCol')}</th>
        </tr>
      </thead>
      <tbody>
        {audit.metrics.map((m) => {
          const text = metricText(m, t, f);
          return (
            <tr key={m.key}>
              <th scope="row" style={{ fontWeight: 600 }}>
                {t(`metricNames.${m.key}`)}
              </th>
              <td className="num">
                {f.pct(m.worstValue)}
                <span className="ci">{m.worstGroup}</span>
              </td>
              <td className="num">
                {f.pct(m.bestValue)}
                <span className="ci">{m.bestGroup}</span>
              </td>
              <td className="num">{text.figure}</td>
              <td className="num">{compactInterval(m, f)}</td>
              <td>
                <VerdictBadge verdict={m.verdict} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Report({
  result,
  config,
  fileName,
}: {
  result: AuditResult;
  config: AuditConfig;
  fileName: string;
}) {
  const { t, f } = useI18n();
  const { deeper } = useAudit();
  const quote = (v: string[]) => f.list(v.map((x) => `«${x}»`));
  const sensitive = config.sensitive
    .map((s) => (s.binEdges ? `${s.column} (${s.binEdges.join(', ')})` : s.column))
    .join(' · ');

  return (
    <article className="report">
      <header className="report-header">
        <div>
          <div className="report-brand">
            <LogoMark size={22} />
            {t('report.page')}
          </div>
          <h1>{t('report.title')}</h1>
          <p className="small" style={{ margin: 0 }}>
            {t('report.generated', { date: f.date(result.generatedAt) })}
          </p>
        </div>
        <p className="small" style={{ maxWidth: '58mm', margin: 0, textAlign: 'right' }}>
          {t('report.privacy')}
        </p>
      </header>

      <p className="report-note">{t('report.readingGuide')}</p>

      <h2>{t('report.summaryTitle')}</h2>
      <dl className="report-kv">
        <dt>{t('report.file')}</dt>
        <dd>{fileName}</dd>
        <dt>{t('report.rows')}</dt>
        <dd>{f.int(result.rowCount)}</dd>
        <dt>{t('report.dropped')}</dt>
        <dd>{f.int(result.droppedRows)}</dd>
        <dt>{t('report.overall')}</dt>
        <dd>{f.pct(result.overall.selectionRate.value)}</dd>
      </dl>

      <h2>{t('report.mappingTitle')}</h2>
      <dl className="report-kv">
        <dt>{t('report.decision')}</dt>
        <dd>{config.decisionColumn}</dd>
        <dt>{t('report.favorable')}</dt>
        <dd>{quote(config.favorableValues)}</dd>
        <dt>{t('report.sensitive')}</dt>
        <dd>{sensitive}</dd>
        <dt>{t('report.truth')}</dt>
        <dd>
          {config.groundTruthColumn
            ? `${config.groundTruthColumn}: ${quote(config.groundTruthFavorableValues ?? [])}`
            : t('report.none')}
        </dd>
      </dl>

      <h2>{t('report.findingsTitle')}</h2>
      {result.attributes.map((a) => (
        <section key={a.attribute}>
          <h3>{a.attribute}</h3>
          {[...a.metrics]
            .sort((x, y) => ORDER[x.verdict] - ORDER[y.verdict])
            .map((m) => (
              <Finding key={m.key} metric={m} />
            ))}
        </section>
      ))}
      <p className="report-note">
        {t('dashboard.conflictBody1')} {t('dashboard.conflictBody2')}
      </p>

      <h2>{t('report.metricsTitle')}</h2>
      {result.attributes.map((a) => {
        const di = a.metrics.find((m) => m.key === 'disparateImpact');
        return (
          <section key={a.attribute}>
            <h3>{a.attribute}</h3>
            <div className="chart-block">
              <RatesChart
                rows={toRows(a.groups)}
                referenceValue={di?.bestValue != null ? di.bestValue * 0.8 : null}
                width={CHART_WIDTH}
                ariaLabel={t('dashboard.ratesTitle')}
              />
            </div>
            <div className="chart-block">
              <MetricsTable audit={a} />
            </div>
            <div className="chart-block">
              <GroupTable
                groups={a.groups}
                hasTruth={result.hasGroundTruth}
                caption={t('report.groupsTitle')}
              />
            </div>
          </section>
        );
      })}

      {result.intersectional && (
        <>
          <h2>{t('report.intersectionalTitle')}</h2>
          <p>{t('dashboard.heatmapCaption')}</p>
          <div className="chart-block">
            <Heatmap data={result.intersectional} />
          </div>
        </>
      )}

      {deeper?.result && (
        <>
          <h2>{t('report.deeperTitle')}</h2>
          <p>{t('deeper.intro')}</p>
          <p>
            <strong>
              {deeper.result.features.some((x) => x.isProxy)
                ? t('deeper.proxyFound', {
                    columns: f.list(
                      deeper.result.features.filter((x) => x.isProxy).map((x) => `«${x.feature}»`),
                    ),
                  })
                : t('deeper.proxyNone')}
            </strong>
          </p>
          <h3>{t('deeper.mitigationTitle')}</h3>
          <div className="chart-block">
            <MitigationTable result={deeper.result} />
          </div>
          <p>
            {tradeoffText(deeper.result, t, f)} {t('deeper.tradeoffNote')}
          </p>
        </>
      )}

      <h2>{t('report.limitationsTitle')}</h2>
      <ul>
        <li>{t('report.limitation1')}</li>
        <li>{t('report.limitation2')}</li>
        <li>{t('report.limitation3')}</li>
        <li>{t('report.limitation4')}</li>
      </ul>

      <footer className="report-footer">
        {t('report.page')} · {f.date(result.generatedAt)} · {t('about.disclaimer')}
      </footer>
    </article>
  );
}

/**
 * Renders the report outside the app shell and opens the print dialog
 * ("Save as PDF"). Print CSS hides everything else. Using the browser's
 * renderer keeps Greek text, fonts and SVG charts crisp without bundling
 * a PDF library and font files.
 */
export function ReportView({ onDone }: { onDone: () => void }) {
  const { result, config, summary } = useAudit();
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    document.body.classList.add('printing-report');
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      document.body.classList.remove('printing-report');
      done.current();
    };
    window.addEventListener('afterprint', finish);
    // Let charts and fonts settle before opening the dialog.
    const timer = window.setTimeout(() => {
      void document.fonts.ready.then(() => window.print());
    }, 300);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', finish);
      document.body.classList.remove('printing-report');
    };
  }, []);

  if (!result || !config) return null;
  return createPortal(
    <div className="print-only">
      <Report result={result} config={config} fileName={summary?.name ?? ''} />
    </div>,
    document.body,
  );
}
