import { useI18n } from '../../i18n';
import { Icon } from '../ui/Icon';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p style={{ maxWidth: '60ch' }}>
          <Icon name="lock" size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          {t('privacy.footer')}
        </p>
        <p>
          {t('app.name')} {t('app.nameAccent')} · {t('about.disclaimer')}
        </p>
      </div>
    </footer>
  );
}
