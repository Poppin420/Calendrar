import { useId, useState } from 'react';
import { useI18n, type MessageKey } from '../../i18n';
import type { DeeperResult } from '../../lib/types';
import { useAudit } from '../AuditContext';
import { Callout } from '../ui/Callout';
import { Icon } from '../ui/Icon';
import { Progress } from '../ui/Skeleton';
import { BeforeAfterChart } from './BeforeAfterChart';
import { ProxyChart } from './ProxyChart';
import { tradeoffText } from './deeperText';

export function FeatureTable({ result }: { result: DeeperResult }) {
  const { t, f } = useI18n();
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={t('deeper.proxyTitle')}>
      <table>
        <thead>
          <tr>
            <th scope="col">{t('deeper.colFeature')}</th>
            <th scope="col" className="num">
              {t('deeper.colAssociation')}
            </th>
            <th scope="col" className="num">
              {t('deeper.colMI')}
            </th>
            <th scope="col" className="num">
              {t('deeper.colImportance')}
            </th>
            <th scope="col" className="num">
              {t('deeper.colCoefficient')}
            </th>
          </tr>
        </thead>
        <tbody>
          {result.features.map((x) => (
            <tr key={x.feature}>
              <th scope="row" style={{ fontWeight: 600 }}>
                {x.feature}
                {x.isProxy && (
                  <span className="proxy-tag">
                    <Icon name="alert" size={12} />
                    {t('deeper.proxyTag')}
                  </span>
                )}
              </th>
              <td className="num">{f.num(x.cramersV)}</td>
              <td className="num">{f.pct(x.mutualInfo)}</td>
              <td className="num">{f.pts(x.permutationImportance)}</td>
              <td className="num">{f.num(x.coefficient)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Before / after comparison of fairness and accuracy. */
export function MitigationTable({ result }: { result: DeeperResult }) {
  const { t, f } = useI18n();
  const b = result.baseline;
  const a = result.reweighed;
  const rows: {
    label: string;
    before: number | null;
    after: number | null;
    higherIsBetter: boolean;
    kind: 'pct' | 'num' | 'pts';
  }[] = [
    {
      label: t('deeper.accuracy'),
      before: b.accuracy,
      after: a.accuracy,
      higherIsBetter: true,
      kind: 'pct',
    },
    {
      label: t('deeper.diRatio'),
      before: b.disparateImpact.ratio?.value ?? null,
      after: a.disparateImpact.ratio?.value ?? null,
      higherIsBetter: true,
      kind: 'num',
    },
    {
      label: t('deeper.dpGap'),
      before: b.demographicParity.difference.value,
      after: a.demographicParity.difference.value,
      higherIsBetter: false,
      kind: 'pts',
    },
  ];
  if (b.equalOpportunity && a.equalOpportunity) {
    rows.push({
      label: t('deeper.eoGap'),
      before: b.equalOpportunity.difference.value,
      after: a.equalOpportunity.difference.value,
      higherIsBetter: false,
      kind: 'pts',
    });
  }
  const fmt = (v: number | null, kind: 'pct' | 'num' | 'pts') =>
    kind === 'pct' ? f.pct(v) : kind === 'num' ? f.num(v) : f.pts(v);
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={t('deeper.mitigationTitle')}>
      <table>
        <thead>
          <tr>
            <th scope="col">{t('deeper.metric')}</th>
            <th scope="col" className="num">
              {t('deeper.before')}
            </th>
            <th scope="col" className="num">
              {t('deeper.after')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const delta = r.before !== null && r.after !== null ? r.after - r.before : null;
            const better =
              delta !== null && Math.abs(delta) > 1e-9 && delta > 0 === r.higherIsBetter;
            const worse = delta !== null && Math.abs(delta) > 1e-9 && !better;
            return (
              <tr key={r.label}>
                <th scope="row" style={{ fontWeight: 500 }}>
                  {r.label}
                </th>
                <td className="num">{fmt(r.before, r.kind)}</td>
                <td className="num">
                  <span className={better ? 'delta-up' : worse ? 'delta-down' : undefined}>
                    {better && (
                      <Icon
                        name="check"
                        size={14}
                        style={{ verticalAlign: '-2px', marginRight: 4 }}
                      />
                    )}
                    {worse && (
                      <Icon
                        name="arrowRight"
                        size={14}
                        style={{
                          verticalAlign: '-2px',
                          marginRight: 4,
                          transform: 'rotate(45deg)',
                        }}
                      />
                    )}
                    {fmt(r.after, r.kind)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Results({ result }: { result: DeeperResult }) {
  const { t, f } = useI18n();
  const { config } = useAudit();
  const proxies = result.features.filter((x) => x.isProxy).map((x) => `«${x.feature}»`);
  const targetColumn =
    result.target === 'groundTruth' ? config?.groundTruthColumn : config?.decisionColumn;
  const proxyId = useId();
  const mitId = useId();
  return (
    <div className="stack" style={{ marginTop: 'var(--space-5)' }}>
      <ul className="small muted" style={{ margin: 0, paddingLeft: '1.2em' }}>
        <li>
          {t(result.target === 'groundTruth' ? 'deeper.targetTruth' : 'deeper.targetDecision', {
            column: targetColumn ?? '',
          })}
        </li>
        <li>
          {t('deeper.split', {
            train: f.int(result.trainSize),
            test: f.int(result.testSize),
            features: f.int(result.featureCount),
          })}
        </li>
        {result.droppedFeatures.length > 0 && (
          <li>{t('deeper.dropped', { columns: result.droppedFeatures.join(', ') })}</li>
        )}
      </ul>

      <section className="chart-card" aria-labelledby={proxyId}>
        <h3 id={proxyId}>{t('deeper.proxyTitle')}</h3>
        <p className="chart-caption">{t('deeper.proxyCaption', { attribute: result.attribute })}</p>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          {proxies.length > 0 ? (
            <Callout tone="warn">
              <p>{t('deeper.proxyFound', { columns: f.list(proxies) })}</p>
            </Callout>
          ) : (
            <Callout tone="ok">
              <p>{t('deeper.proxyNone')}</p>
            </Callout>
          )}
        </div>
        <ProxyChart
          features={result.features}
          ariaLabel={`${t('deeper.proxyTitle')}: ${result.features
            .slice(0, 8)
            .map((x) => `${x.feature} V=${f.num(x.cramersV)}`)
            .join(', ')}`}
        />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <FeatureTable result={result} />
        </div>
      </section>

      <section className="chart-card" aria-labelledby={mitId}>
        <h3 id={mitId}>{t('deeper.mitigationTitle')}</h3>
        <p className="chart-caption" style={{ maxWidth: '72ch' }}>
          {t('deeper.mitigationIntro')}
        </p>
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="stack">
            <MitigationTable result={result} />
            <p style={{ margin: 0 }}>
              <strong>{tradeoffText(result, t, f)}</strong>
            </p>
            <p className="small muted" style={{ margin: 0 }}>
              {t('deeper.tradeoffNote')}
            </p>
          </div>
          <div>
            <h4>{t('deeper.ratesChartTitle')}</h4>
            <BeforeAfterChart
              before={result.baseline}
              after={result.reweighed}
              ariaLabel={t('deeper.ratesChartTitle')}
            />
          </div>
        </div>
        <details style={{ marginTop: 'var(--space-4)' }}>
          <summary>{t('deeper.weightsTitle')}</summary>
          <div className="table-wrap" style={{ marginTop: 'var(--space-3)' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('deeper.weightGroup')}</th>
                  <th scope="col">{t('deeper.weightLabel')}</th>
                  <th scope="col" className="num">
                    {t('deeper.weightValue')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.weights.map((w) => (
                  <tr key={`${w.group}-${w.label}`}>
                    <td>{w.group}</td>
                    <td>{w.label === 1 ? t('deeper.favorable') : t('deeper.unfavorable')}</td>
                    <td className="num">{f.num(w.weight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}

export function DeeperPanel() {
  const { t } = useI18n();
  const { config, deeper, runDeeper } = useAudit();
  const [attr, setAttr] = useState(0);
  const selectId = useId();
  if (!config) return null;
  const options = config.sensitive.map((s, i) => ({ value: i, label: s.column }));
  if (config.sensitive.length >= 2) {
    options.push({
      value: config.sensitive.length,
      label: config.sensitive.map((s) => s.column).join(' × '),
    });
  }
  const stageKey = `deeper.stage_${deeper?.stage ?? 'prepare'}` as MessageKey;

  return (
    <section className="section no-print" aria-labelledby="deeper-title">
      <hr className="rule" />
      <h2 id="deeper-title">{t('deeper.title')}</h2>
      <p className="lead" style={{ fontSize: '1.05rem' }}>
        {t('deeper.intro')}
      </p>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div className="field" style={{ minWidth: 220 }}>
          <label htmlFor={selectId}>{t('deeper.attributeLabel')}</label>
          <select id={selectId} value={attr} onChange={(e) => setAttr(Number(e.target.value))}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => void runDeeper(attr)}
          disabled={deeper?.running}
        >
          <Icon name="search" />
          {deeper?.result ? t('deeper.rerun') : t('deeper.run')}
        </button>
      </div>

      {deeper?.running && (
        <div style={{ marginTop: 'var(--space-4)' }} aria-live="polite">
          <p className="small" style={{ marginBottom: 'var(--space-2)' }}>
            {t('deeper.running')} {t(stageKey)}
          </p>
          <Progress value={deeper.progress} label={t('deeper.running')} />
        </div>
      )}
      {deeper?.error && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Callout tone="error" role="alert">
            <p>{t(deeper.error.key, deeper.error.params)}</p>
          </Callout>
        </div>
      )}
      {deeper?.result && !deeper.running && <Results result={deeper.result} />}
    </section>
  );
}
