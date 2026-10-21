import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n';
import { MIN_GROUP_SIZE } from '../../lib/metrics/groups';
import type { AttributeAudit, AuditConfig, AuditResult } from '../../lib/types';
import { useAudit } from '../AuditContext';
import { DeeperPanel } from '../deeper/DeeperPanel';
import { ReportView } from '../report/ReportView';
import { Callout } from '../ui/Callout';
import { Icon } from '../ui/Icon';
import { SkeletonBlock, SkeletonLines } from '../ui/Skeleton';
import { GroupTable } from './GroupTable';
import { Heatmap } from './Heatmap';
import { MetricCard } from './MetricCard';
import { RatesChart } from './RatesChart';
import { toRows } from './rates';

function countVerdicts(result: AuditResult) {
  const all = result.attributes.flatMap((a) => a.metrics);
  return {
    concern: all.filter((m) => m.verdict === 'concern').length,
    inconclusive: all.filter((m) => m.verdict === 'inconclusive').length,
  };
}

function Summary({ result, config }: { result: AuditResult; config: AuditConfig }) {
  const { t, f } = useI18n();
  const { concern, inconclusive } = countVerdicts(result);
  const quote = (v: string[]) => f.list(v.map((x) => `«${x}»`));
  return (
    <div className="stack">
      <div className="summary-strip">
        <div className="stat">
          <div className="value">{f.int(result.rowCount)}</div>
          <div className="label">{t('dashboard.summaryRows', { n: '' }).trim()}</div>
        </div>
        <div className="stat">
          <div className="value">{f.pct(result.overall.selectionRate.value)}</div>
          <div className="label">
            {t('dashboard.summaryOverall', { rate: '' }).replace(/[:：]\s*$/, '')}
          </div>
        </div>
        <div className="stat">
          <div className="value" style={{ color: concern ? 'var(--concern)' : 'var(--ok)' }}>
            <Icon
              name={concern ? 'alert' : 'check'}
              size={22}
              style={{ verticalAlign: '-2px', marginRight: 6 }}
            />
            {f.int(concern)}
          </div>
          <div className="label">{t('verdict.concern')}</div>
        </div>
        <div className="stat">
          <div
            className="value"
            style={{ color: inconclusive ? 'var(--inconclusive)' : undefined }}
          >
            <Icon name="help" size={22} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {f.int(inconclusive)}
          </div>
          <div className="label">{t('verdict.inconclusive')}</div>
        </div>
      </div>
      <ul className="small muted" style={{ margin: 0, paddingLeft: '1.2em' }}>
        <li>
          {t('dashboard.summaryFavorable', {
            values: quote(config.favorableValues),
            column: config.decisionColumn,
          })}
        </li>
        {config.groundTruthColumn ? (
          <li>
            {t('dashboard.summaryTruth', {
              values: quote(config.groundTruthFavorableValues ?? []),
              column: config.groundTruthColumn,
            })}
          </li>
        ) : (
          <li>{t('dashboard.noTruth')}</li>
        )}
        {result.droppedRows > 0 && (
          <li>{t('dashboard.summaryDropped', { n: f.int(result.droppedRows) })}</li>
        )}
      </ul>
    </div>
  );
}

function AttributePanel({ audit, result }: { audit: AttributeAudit; result: AuditResult }) {
  const { t, f } = useI18n();
  const di = audit.metrics.find((m) => m.key === 'disparateImpact');
  const excluded = audit.groups.filter((g) => g.n < MIN_GROUP_SIZE).map((g) => g.group);
  const isIntersection = audit.columns.length > 1;
  const chartTitleId = useId();
  return (
    <div className="stack">
      <h3 className="visually-hidden">{audit.attribute}</h3>
      <section aria-label={t('dashboard.metricsTitle')}>
        <div className="grid grid-2">
          {audit.metrics.map((m) => (
            <MetricCard key={m.key} metric={m} />
          ))}
        </div>
        {excluded.length > 0 && (
          <p className="help" style={{ marginTop: 'var(--space-3)' }}>
            <Icon name="warning" size={14} style={{ verticalAlign: '-2px' }} />{' '}
            {t('dashboard.groupsExcluded', {
              groups:
                excluded.length > 6 ? `${excluded.slice(0, 6).join(', ')}…` : excluded.join(', '),
            })}
          </p>
        )}
      </section>

      {isIntersection && result.intersectional && (
        <section className="chart-card" aria-labelledby="heatmap-title">
          <h4 id="heatmap-title">
            {t('dashboard.heatmapTitle', {
              a: result.intersectional.rowAttribute,
              b: result.intersectional.colAttribute,
            })}
          </h4>
          <p className="chart-caption">{t('dashboard.heatmapCaption')}</p>
          <Heatmap data={result.intersectional} />
        </section>
      )}

      <section className="chart-card" aria-labelledby={chartTitleId}>
        <h4 id={chartTitleId}>{t('dashboard.ratesTitle')}</h4>
        <p className="chart-caption">{t('dashboard.ratesCaption')}</p>
        <RatesChart
          rows={toRows(audit.groups)}
          referenceValue={di?.bestValue != null ? di.bestValue * 0.8 : null}
          ariaLabel={`${t('dashboard.ratesTitle')}: ${audit.groups
            .map((g) => `${g.group} ${f.pct(g.selectionRate.value)}`)
            .join(', ')}`}
        />
      </section>

      <section aria-label={t('dashboard.tableTitle')}>
        <GroupTable
          groups={audit.groups}
          hasTruth={result.hasGroundTruth}
          caption={`${t('dashboard.tableTitle')}: ${audit.attribute}`}
        />
      </section>
    </div>
  );
}

function AttributeTabs({ result }: { result: AuditResult }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const n = result.attributes.length;

  const onKey = (e: KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    let next = active;
    if (delta) next = (active + delta + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  const audit = result.attributes[Math.min(active, n - 1)];
  return (
    <div>
      <div
        className="tabs"
        role="tablist"
        aria-label={t('dashboard.attributeTabs')}
        onKeyDown={onKey}
      >
        {result.attributes.map((a, i) => {
          const concerns = a.metrics.filter((m) => m.verdict === 'concern').length;
          return (
            <button
              key={a.attribute}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
            >
              {a.attribute}
              {concerns > 0 && (
                <span
                  className="verdict verdict-concern"
                  style={{ marginLeft: 8, padding: '0 8px 0 4px' }}
                >
                  <Icon name="alert" size={13} />
                  {concerns}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${active}`}>
        <AttributePanel key={audit.attribute} audit={audit} result={result} />
      </div>
    </div>
  );
}

export function ResultsDashboard() {
  const { t } = useI18n();
  const { result, config, auditing, error, goTo, reset } = useAudit();
  const [printing, setPrinting] = useState(false);

  const header = (
    <div
      className="row no-print"
      style={{ alignItems: 'flex-end', marginBottom: 'var(--space-5)' }}
    >
      <h2 style={{ margin: 0 }}>{t('dashboard.title')}</h2>
      <div className="spacer" />
      <button type="button" className="btn btn-ghost btn-small" onClick={() => goTo('mapping')}>
        <Icon name="arrowLeft" size={16} />
        {t('dashboard.editMapping')}
      </button>
      <button type="button" className="btn btn-ghost btn-small" onClick={reset}>
        <Icon name="refresh" size={16} />
        {t('dashboard.restart')}
      </button>
      {result && !result.singleClass && (
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={() => setPrinting(true)}
          title={t('dashboard.exportHint')}
        >
          <Icon name="download" size={16} />
          {t('dashboard.exportPdf')}
        </button>
      )}
    </div>
  );

  if (auditing) {
    return (
      <div aria-busy="true">
        {header}
        <p role="status">{t('dashboard.computing')}</p>
        <div className="grid grid-2">
          <SkeletonBlock height={160} />
          <SkeletonBlock height={160} />
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <SkeletonLines lines={3} />
          <SkeletonBlock height={260} />
        </div>
      </div>
    );
  }

  if (error || !result || !config) {
    return (
      <div>
        {header}
        <div className="card state-card">
          <Icon name="alert" size={36} />
          <h3>{t('errors.title')}</h3>
          {error && <p>{t(error.key, error.params)}</p>}
          <button type="button" className="btn btn-primary" onClick={() => goTo('mapping')}>
            {t('dashboard.editMapping')}
          </button>
        </div>
      </div>
    );
  }

  if (result.singleClass || result.rowCount === 0) {
    return (
      <div>
        {header}
        <div className="card state-card">
          <Icon name="info" size={36} />
          <p style={{ maxWidth: '52ch' }}>{t('dashboard.singleClass')}</p>
          <button type="button" className="btn btn-primary" onClick={() => goTo('mapping')}>
            {t('dashboard.editMapping')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <Summary result={result} config={config} />
      <section
        className="section"
        aria-labelledby="metrics-title"
        style={{ paddingTop: 'var(--space-6)' }}
      >
        <h2 id="metrics-title" style={{ fontSize: '1.5rem' }}>
          {t('dashboard.metricsTitle')}
        </h2>
        <AttributeTabs result={result} />
      </section>
      <section
        className="section"
        aria-labelledby="conflict-title"
        style={{ paddingTop: 'var(--space-6)' }}
      >
        <Callout tone="info">
          <p>
            <strong id="conflict-title">{t('dashboard.conflictTitle')}.</strong>{' '}
            {t('dashboard.conflictBody1')}
          </p>
          <p>{t('dashboard.conflictBody2')}</p>
        </Callout>
      </section>
      <DeeperPanel />
      {printing && <ReportView onDone={() => setPrinting(false)} />}
    </div>
  );
}
