import { useI18n } from '../../i18n';
import type { MetricResult } from '../../lib/types';
import { VerdictBadge } from '../ui/Verdict';
import { metricText } from './verdictText';

export function MetricCard({ metric }: { metric: MetricResult }) {
  const { t, f } = useI18n();
  const text = metricText(metric, t, f);
  return (
    <article className={`metric-card v-${metric.verdict}`}>
      <header>
        <div>
          <h4>{t(`metricNames.${metric.key}`)}</h4>
        </div>
        <VerdictBadge verdict={metric.verdict} />
      </header>
      <p className="question">{t(`metricQuestions.${metric.key}`)}</p>
      <div className="row" style={{ alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
        <span className="figure">
          {text.figure}
          {text.figureUnit && <small>{text.figureUnit}</small>}
        </span>
      </div>
      <p className="sentence">
        {text.main} <strong>{text.verdict}</strong>
      </p>
      {text.interval && (
        <details>
          <summary>{t('common.learnMore')}</summary>
          <p style={{ margin: 'var(--space-2) 0 0' }}>
            {text.interval} <a href="#/methodology">{t('nav.methodology')}</a>
          </p>
        </details>
      )}
    </article>
  );
}
