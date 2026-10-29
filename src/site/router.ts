// Minimal hash router (works on GitHub Pages without rewrites).
import { useEffect, useState } from 'react';

export interface Route {
  path: string;
  query: URLSearchParams;
}

const parse = (): Route => {
  const hash = window.location.hash.slice(1) || '/';
  const [path, qs = ''] = hash.split('?');
  return { path, query: new URLSearchParams(qs) };
};

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (path: string, query?: Record<string, string>) => {
  const qs = query ? new URLSearchParams(query).toString() : '';
  return `#${path}${qs ? `?${qs}` : ''}`;
};

/** Update the query string without adding a history entry. */
export function replaceQuery(path: string, query: Record<string, string>) {
  history.replaceState(null, '', href(path, query));
}
