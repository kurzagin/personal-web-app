import type { PostItem } from '@kurzagin/shared';

export interface PostMediaItem {
  id: string;
  post_id: string;
  url: string;
  alt_text?: string | null;
  mime_type?: string | null;
}

export interface WebDbPost extends Omit<PostItem, 'anime_meta' | 'media'> {
  author_avatar?: string | null;
  media?: PostMediaItem[];
  anime_meta?: {
    title?: string;
    cover_url?: string;
    score?: number;
    episode?: number | null;
    review_type?: string | null;
    has_spoilers?: boolean;
  } | null;
}

export interface GuestbookEntry {
  id: string;
  author_name: string;
  content: string;
  reply_content?: string | null;
  reply_author?: string | null;
  reply_at?: string | null;
  created_at: string;
}

export interface ProjectEntry {
  title: string;
  description: string;
  url?: string;
  badge?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface WebProfile {
  name: string;
  handle: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  status_message?: string;
  location?: string;
  contact_email?: string;
  social_links?: SocialLink[];
  currently_building?: ProjectEntry[];
}

export interface DbTrack {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  audio_url: string;
  cover_url?: string | null;
  duration?: string | number | null;
  duration_sec?: number | null;
}

export interface AnimeReviewItem {
  id: string;
  content: string;
  score?: number | null;
  episode?: number | null;
  review_type?: string | null;
  has_spoilers?: boolean;
  created_at: string;
}

export interface AnimeWatchlistItem {
  id: string;
  anilist_id: number;
  title: string;
  title_jp?: string | null;
  cover_url?: string | null;
  format?: string | null;
  status: 'watching' | 'completed' | 'paused' | 'planning' | 'dropped';
  current_episode: number;
  total_episodes?: number | null;
  score?: number | null;
  season_year?: number | null;
  season?: string | null;
  genres?: string[] | null;
  reviews?: AnimeReviewItem[];
  latest_review?: AnimeReviewItem | null;
}

export interface GameItem {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  cover_url?: string | null;
  meta?: {
    status?: string;
    platform?: string;
    progress?: string;
  };
}

export async function verifyOperatorSession(endpoint: string, token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return {
      valid: !!data.authenticated,
      username: data.user?.username,
    };
  } catch (err) {
    return { valid: false };
  }
}

export async function loginOperator(
  endpoint: string,
  username: string,
  passphrase: string
): Promise<{ success: boolean; token?: string; username?: string; error?: string }> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/auth/operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passphrase }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !data?.token) {
      return { success: false, error: data?.error || 'Invalid credentials' };
    }
    return {
      success: true,
      token: data.token,
      username: data.user?.username || username,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during login' };
  }
}

export async function fetchFeedPosts(endpoint: string, filter?: string): Promise<{ posts: WebDbPost[]; mediaByPost: Record<string, PostMediaItem[]> }> {
  const formatted = endpoint.replace(/\/$/, '');
  const url = filter && filter !== 'all' ? `${formatted}/api/posts?filter=${encodeURIComponent(filter)}` : `${formatted}/api/posts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  const data = await res.json();
  const rawPosts: any[] = data.posts || [];
  const mediaByPost: Record<string, PostMediaItem[]> = data.mediaByPost || {};

  // Normalize media items into mediaByPost dictionary
  rawPosts.forEach((p) => {
    if (Array.isArray(p.media) && p.media.length > 0 && !mediaByPost[p.id]) {
      mediaByPost[p.id] = p.media;
    }
  });

  return { posts: rawPosts, mediaByPost };
}

export async function fetchProfile(endpoint: string): Promise<WebProfile | null> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/profile`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile || null;
  } catch {
    return null;
  }
}

export async function fetchTracks(endpoint: string): Promise<DbTrack[]> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/tracks`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.tracks || [];
  } catch {
    return [];
  }
}

export async function fetchAnimeList(endpoint: string, status?: string): Promise<AnimeWatchlistItem[]> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const url = status && status !== 'all'
      ? `${formatted}/api/anime?status=${encodeURIComponent(status)}&limit=all`
      : `${formatted}/api/anime?limit=all`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.anime || [];
  } catch {
    return [];
  }
}

export async function fetchGuestbook(endpoint: string): Promise<GuestbookEntry[]> {
  const formatted = endpoint.replace(/\/$/, '');
  const res = await fetch(`${formatted}/api/guestbook`);
  if (!res.ok) throw new Error(`Guestbook fetch failed: ${res.status}`);
  const data = await res.json();
  return data.entries || [];
}

export async function signGuestbook(
  endpoint: string,
  content: string,
  authorName: string = 'guest'
): Promise<{ success: boolean; entry?: GuestbookEntry; error?: string }> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/guestbook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, authorName }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return { success: false, error: data?.error || 'Failed to sign guestbook' };
    }
    return { success: true, entry: data.entry };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function postGuestbookReply(
  endpoint: string,
  token: string,
  id: string,
  replyContent: string
): Promise<{ success: boolean; error?: string }> {
  const formatted = endpoint.replace(/\/$/, '');
  const res = await fetch(`${formatted}/api/guestbook`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id,
      replyContent,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    return { success: false, error: data?.error || 'Failed to submit reply' };
  }
  return { success: true };
}

export async function createPost(
  endpoint: string,
  token: string,
  content: string,
  category: string = 'general'
): Promise<{ success: boolean; error?: string }> {
  const formatted = endpoint.replace(/\/$/, '');
  const res = await fetch(`${formatted}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content,
      category,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { success: false, error: data?.error || 'Failed to publish post' };
  }
  return { success: true };
}
