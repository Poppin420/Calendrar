import { useI18n, type Lang } from '../../i18n';
import { hrefFor, type Route } from '../../lib/useRoute';
import { useTheme } from '../../lib/useTheme';
import { Icon } from '../ui/Icon';
import { LogoMark } from '../ui/Logo';

const LANGS: { code: Lang; label: string; name: string }[] = [
  { code: 'el', label: 'ΕΛ', name: 'Ελληνικά' },
  { code: 'en', label: 'EN', name: 'English' },
];

export function Header({ route }: { route: Route }) {
  const { t, lang, setLang } = useI18n();
  const [theme, toggleTheme] = useTheme();
  const links: Route[] = ['audit', 'methodology', 'about'];

  return (
    <header className="header">
      <div className="container header-inner">
        <a className="brand" href={hrefFor('audit')}>
          <LogoMark />
          <span>
            {t('app.name')} <em>{t('app.nameAccent')}</em>
          </span>
        </a>
        <nav className="nav" aria-label={t('nav.menu')}>
          {links.map((r) => (
            <a key={r} href={hrefFor(r)} aria-current={route === r ? 'page' : undefined}>
              {t(`nav.${r}`)}
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <div className="lang-switch" role="group" aria-label={t('nav.language')}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                lang={l.code}
                aria-pressed={lang === l.code}
                aria-label={l.name}
                onClick={() => setLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('nav.themeToLight') : t('nav.themeToDark')}
            title={theme === 'dark' ? t('nav.themeToLight') : t('nav.themeToDark')}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </div>
    </header>
  );
}
