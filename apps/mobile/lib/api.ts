import type { PostItem } from '@kurzagin/shared';

export interface PostMediaItem {
  id: string;
  post_id: string;
  url: string;
  alt_text?: string | null;
  mime_type?: string | null;
}

export interface WebDbPost extends Omit<PostItem, 'anime_meta' | 'media'> {
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
  duration?: number | null;
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

export async function fetchFeedPosts(endpoint: string, filter?: string): Promise<{ posts: WebDbPost[]; mediaByPost: Record<string, PostMediaItem[]> }> {
  const formatted = endpoint.replace(/\/$/, '');
  const url = filter && filter !== 'all' ? `${formatted}/api/posts?filter=${encodeURIComponent(filter)}` : `${formatted}/api/posts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  const data = await res.json();
  const posts = data.posts || [];
  const mediaByPost = data.mediaByPost || {};
  return { posts, mediaByPost };
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

export async function fetchGuestbook(endpoint: string): Promise<GuestbookEntry[]> {
  const formatted = endpoint.replace(/\/$/, '');
  const res = await fetch(`${formatted}/api/guestbook`);
  if (!res.ok) throw new Error(`Guestbook fetch failed: ${res.status}`);
  const data = await res.json();
  return data.entries || [];
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
