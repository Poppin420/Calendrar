import { DEMOS } from '../data/demos';
import { useI18n } from '../i18n';
import { useAudit } from './AuditContext';
import { Icon } from './ui/Icon';

export function DemoPicker({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const { t, f } = useI18n();
  const { loadDemo, parsing } = useAudit();
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const Hc = headingLevel === 2 ? 'h3' : 'h4';
  return (
    <section aria-labelledby="demo-title">
      <H id="demo-title">{t('demo.title')}</H>
      <p className="muted">{t('demo.intro')}</p>
      <div className="grid grid-2">
        {DEMOS.map((d) => (
          <article key={d.id} className="card demo-card">
            <Hc>{t(d.nameKey)}</Hc>
            <div className="meta">
              {t('demo.rows', { n: f.int(d.rows) })} ·{' '}
              <a href={d.sourceUrl} target="_blank" rel="noreferrer noopener">
                {t('demo.source')}: {d.sourceLabel}
              </a>
            </div>
            <p className="small" style={{ margin: 0 }}>
              {t(d.descriptionKey)}
            </p>
            <div>
              <strong className="small">{t('demo.lookFor')}</strong>
              <ul>
                {d.lookFor.map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className="btn btn-accent btn-small"
              onClick={() => void loadDemo(d)}
              disabled={parsing !== undefined}
            >
              <Icon name="file" size={16} />
              {t('demo.load')}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
