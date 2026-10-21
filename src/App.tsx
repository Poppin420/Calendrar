import { lazy, Suspense, useEffect, useRef } from 'react';
import { AuditProvider } from './components/AuditContext';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { SkeletonLines } from './components/ui/Skeleton';
import { I18nProvider, useI18n } from './i18n';
import { AuditPage } from './pages/AuditPage';
import { useRoute } from './lib/useRoute';

const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function Shell() {
  const route = useRoute();
  const { t } = useI18n();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  // Move focus to the content on page change so screen readers announce it.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus();
  }, [route]);

  return (
    <div className="shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        {t('nav.skip')}
      </a>
      <Header route={route} />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Suspense
          fallback={
            <div className="container section">
              <SkeletonLines lines={5} />
            </div>
          }
        >
          {/* The audit page stays mounted so its state survives navigation. */}
          <div hidden={route !== 'audit'}>
            <AuditPage />
          </div>
          {route === 'methodology' && <MethodologyPage />}
          {route === 'about' && <AboutPage />}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuditProvider>
        <Shell />
      </AuditProvider>
    </I18nProvider>
  );
}
