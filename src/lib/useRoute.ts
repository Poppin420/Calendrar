import { useEffect, useState } from 'react';

export type Route = 'audit' | 'methodology' | 'about';

const ROUTES: Record<string, Route> = {
  '': 'audit',
  '/': 'audit',
  '/methodology': 'methodology',
  '/about': 'about',
};

export function parseRoute(hash: string): Route {
  return ROUTES[hash.replace(/^#/, '').split('?')[0]] ?? 'audit';
}

export function hrefFor(route: Route): string {
  return route === 'audit' ? '#/' : `#/${route}`;
}

/** Minimal hash router: works on any static host without server rewrites. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
