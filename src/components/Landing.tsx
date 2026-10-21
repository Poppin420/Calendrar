import { useI18n } from '../i18n';
import { useAudit } from './AuditContext';
import { DemoPicker } from './DemoPicker';
import { Icon } from './ui/Icon';

/** Small decorative chart for the hero: two groups, their intervals and the 80% line. */
function HeroFigure() {
  const { t, f } = useI18n();
  const bars = [
    { label: 'A', v: 0.62 },
    { label: 'B', v: 0.38 },
  ];
  const base = 160;
  const scale = 200;
  const line = base - 0.62 * 0.8 * scale;
  return (
    <figure className="hero-figure" aria-hidden="true" style={{ margin: 0 }}>
      <svg viewBox="0 0 360 190" width="100%" role="presentation">
        <line x1="30" y1={base} x2="350" y2={base} stroke="var(--line-strong)" />
        {bars.map((b, i) => {
          const h = b.v * scale;
          const x = 60 + i * 100;
          const cx = x + 32;
          return (
            <g key={b.label}>
              <rect x={x} y={base - h} width="64" height={h} rx="4" fill="var(--series-1)" />
              <path
                d={`M${cx} ${base - h - 14}V${base - h + 14}M${cx - 7} ${base - h - 14}h14M${cx - 7} ${base - h + 14}h14`}
                stroke="var(--ink)"
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y="178"
                textAnchor="middle"
                fontSize="13"
                fill="var(--ink-2)"
                fontWeight="600"
              >
                {b.label}
              </text>
              <text
                x={cx}
                y={base - 12}
                textAnchor="middle"
                fontSize="14"
                fill="#ffffff"
                fontWeight="700"
              >
                {f.pct(b.v, 0)}
              </text>
            </g>
          );
        })}
        <line
          x1="30"
          x2="350"
          y1={line}
          y2={line}
          stroke="var(--concern-mark)"
          strokeDasharray="5 4"
          strokeWidth="1.5"
        />
        <text x="350" y={line + 16} textAnchor="end" fontSize="11" fill="var(--ink-3)">
          {t('dashboard.fourFifthsLine')}
        </text>
      </svg>
      <figcaption>
        <span className="verdict verdict-concern">
          <Icon name="alert" size={16} />
          {t('verdict.concern')}
        </span>{' '}
        {t('sentences.disparateImpact', {
          worst: 'B',
          best: 'A',
          ratio: f.pct(0.38 / 0.62, 0),
          worstRate: f.pct(0.38, 0),
          bestRate: f.pct(0.62, 0),
        })}
      </figcaption>
    </figure>
  );
}

export function Landing() {
  const { t } = useI18n();
  const { goTo } = useAudit();
  return (
    <div className="container">
      <section className="hero">
        <div>
          <span className="eyebrow">{t('landing.eyebrow')}</span>
          <h1>{t('landing.title')}</h1>
          <p className="lead">{t('landing.lead')}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => goTo('upload')}>
              <Icon name="upload" />
              {t('landing.upload')}
            </button>
            <a className="btn" href="#demos">
              {t('landing.tryDemo')}
              <Icon name="arrowRight" />
            </a>
          </div>
          <p className="privacy-ribbon" style={{ marginTop: 'var(--space-5)' }}>
            <Icon name="lock" size={16} />
            {t('privacy.badge')}
          </p>
        </div>
        <HeroFigure />
      </section>

      <section className="card privacy-card" aria-labelledby="privacy-title">
        <Icon name="lock" size={28} />
        <div>
          <h2 id="privacy-title" style={{ fontSize: '1.3rem' }}>
            {t('privacy.landingTitle')}
          </h2>
          <p style={{ margin: 0 }}>{t('privacy.landingBody')}</p>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <h2 id="how-title">{t('landing.howTitle')}</h2>
        <ol className="steps-list">
          {(['1', '2', '3'] as const).map((n) => (
            <li key={n}>
              <h3>{t(`landing.step${n}Title`)}</h3>
              <p>{t(`landing.step${n}Body`)}</p>
            </li>
          ))}
        </ol>
        <p className="muted" style={{ marginTop: 'var(--space-5)' }}>
          <strong>{t('landing.whoTitle')}:</strong> {t('landing.whoBody')}
        </p>
      </section>

      <div className="section" id="demos">
        <DemoPicker />
      </div>
    </div>
  );
}
