export type NavCurrent = 'home' | 'music' | 'anime' | 'games' | 'novels' | 'profile' | 'guestbook' | 'tools';

/** Maps a pathname to the section highlighted in the navigation (mirrors the old per-page `current` prop). */
export function getCurrent(pathname: string | null): NavCurrent {
  const p = (pathname || '/').replace(/\/$/, '') || '/';
  if (p === '/music') return 'music';
  if (p === '/anime') return 'anime';
  if (p === '/games') return 'games';
  if (p === '/novels' || p.startsWith('/novels/')) return 'novels';
  if (p === '/tools' || p.startsWith('/tools/')) return 'tools';
  if (p === '/profile') return 'profile';
  if (p === '/guestbook') return 'guestbook';
  return 'home';
}
