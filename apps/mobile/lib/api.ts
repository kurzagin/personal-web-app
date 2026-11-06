import type { PostItem } from '@kurzagin/shared';

export interface GuestbookEntry {
  id: string;
  author_name: string;
  content: string;
  reply_content?: string | null;
  reply_author?: string | null;
  reply_at?: string | null;
  created_at: string;
}

export interface WebProfile {
  name: string;
  handle: string;
  bio: string;
  avatar_url?: string;
  status?: string;
  location?: string;
  socials?: Record<string, string>;
}

export interface ApiClient {
  endpoint: string;
  token: string | null;
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

export async function fetchFeedPosts(endpoint: string, filter?: string): Promise<PostItem[]> {
  const formatted = endpoint.replace(/\/$/, '');
  const url = filter ? `${formatted}/api/posts?filter=${encodeURIComponent(filter)}` : `${formatted}/api/posts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  const data = await res.json();
  return data.posts || [];
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
