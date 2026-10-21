import { useI18n } from '../i18n';
import { Icon } from '../components/ui/Icon';

/** Replace these placeholders with your own profile links. */
const LINKS = {
  github: 'https://github.com/your-username',
  linkedin: 'https://www.linkedin.com/in/your-profile',
  repo: 'https://github.com/your-username/fairness-audit-playground',
};

export default function AboutPage() {
  const { t } = useI18n();
  const initials = t('about.authorName')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  return (
    <div className="container section">
      <article className="prose">
        <span className="eyebrow">{t('nav.about')}</span>
        <h1>{t('about.title')}</h1>
        <p className="lead">{t('about.lead')}</p>

        <h2>{t('about.motivationTitle')}</h2>
        <p>{t('about.motivation1')}</p>
        <p>{t('about.motivation2')}</p>

        <h2>{t('about.authorTitle')}</h2>
        <div className="card author-card">
          <div className="avatar" aria-hidden="true">
            {initials}
          </div>
          <div>
            <h3 style={{ marginBottom: 'var(--space-1)' }}>{t('about.authorName')}</h3>
            <p className="muted" style={{ marginBottom: 'var(--space-2)' }}>
              {t('about.authorRole')}
            </p>
            <p style={{ marginBottom: 'var(--space-3)' }}>{t('about.authorBio')}</p>
            <div className="row">
              <a
                className="btn btn-small"
                href={LINKS.github}
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('about.github')}
                <Icon name="arrowRight" size={14} />
              </a>
              <a
                className="btn btn-small"
                href={LINKS.linkedin}
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('about.linkedin')}
                <Icon name="arrowRight" size={14} />
              </a>
            </div>
          </div>
        </div>

        <h2>{t('about.stackTitle')}</h2>
        <p>{t('about.stackBody')}</p>
        <p>
          <a href={LINKS.repo} target="_blank" rel="noreferrer noopener">
            {LINKS.repo.replace('https://', '')}
          </a>
        </p>

        <h2>{t('privacy.landingTitle')}</h2>
        <p>{t('privacy.landingBody')}</p>

        <h2>{t('about.disclaimerTitle')}</h2>
        <p>{t('about.disclaimer')}</p>
      </article>
    </div>
  );
}
