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

export interface UploadedMediaItem {
  url: string;
  category?: string;
  media_type?: string;
  width?: number;
  height?: number;
}

export async function uploadPostImage(
  endpoint: string,
  token: string,
  fileUri: string,
  fileName?: string
): Promise<{ success: boolean; url?: string; width?: number; height?: number; error?: string }> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const cleanFileName = fileName || fileUri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(cleanFileName);
    const type = match ? `image/${match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase()}` : `image/jpeg`;

    const formData = new FormData();
    // React Native FormData accepts an object with uri, name, and type
    formData.append('image', {
      uri: fileUri,
      name: cleanFileName,
      type,
    } as any);

    const res = await fetch(`${formatted}/api/media/upload-post-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return { success: false, error: data?.error || 'Failed to upload image' };
    }

    return {
      success: true,
      url: data.url,
      width: data.width,
      height: data.height,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network upload error' };
  }
}

export async function createPost(
  endpoint: string,
  token: string,
  content: string,
  media: UploadedMediaItem[] = []
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
      media,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { success: false, error: data?.error || 'Failed to publish post' };
  }
  return { success: true };
}

export interface AniListSearchResult {
  id: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  coverImage?: {
    large?: string;
    medium?: string;
    extraLarge?: string;
  };
  bannerImage?: string;
  format?: string;
  episodes?: number;
  seasonYear?: number;
  genres?: string[];
  description?: string;
  studios?: {
    nodes?: Array<{ name: string }>;
  };
}

export async function searchAniList(endpoint: string, query: string): Promise<AniListSearchResult[]> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/anime/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export interface AddAnimePayload {
  anilist_id: number;
  title: string;
  romaji_title?: string;
  native_title?: string;
  cover_url?: string | null;
  banner_url?: string | null;
  format?: string | null;
  status: string;
  current_episode: number;
  total_episodes?: number | null;
  score?: number | null;
  genres?: string[];
  studio?: string | null;
  season_year?: number | null;
  summary?: string | null;
}

export async function addAnimeToWatchlist(
  endpoint: string,
  token: string,
  payload: AddAnimePayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/anime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: data?.error || 'Failed to add anime' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function uploadCoverImage(
  endpoint: string,
  token: string,
  fileUri: string,
  fileName?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const cleanFileName = fileName || fileUri.split('/').pop() || 'cover.jpg';
    const match = /\.(\w+)$/.exec(cleanFileName);
    const type = match ? `image/${match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase()}` : `image/jpeg`;

    const formData = new FormData();
    formData.append('cover', {
      uri: fileUri,
      name: cleanFileName,
      type,
    } as any);
    formData.append('image', {
      uri: fileUri,
      name: cleanFileName,
      type,
    } as any);

    let res = await fetch(`${formatted}/api/media/upload-cover`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    let data = await res.json().catch(() => null);

    // Fallback to upload-post-image if upload-cover fails
    if (!res.ok || !data?.success) {
      res = await fetch(`${formatted}/api/media/upload-post-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      data = await res.json().catch(() => null);
    }

    if (!res.ok || !data?.success || !data?.url) {
      return { success: false, error: data?.error || 'Failed to upload cover art' };
    }

    return { success: true, url: data.url };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error uploading cover art' };
  }
}

export async function presignAudioUpload(
  endpoint: string,
  token: string,
  filename: string,
  contentType: string = 'audio/ogg; codecs=opus'
): Promise<{ success: boolean; uploadUrl?: string; publicUrl?: string; contentType?: string; error?: string }> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/media/presign-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename,
        contentType,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return { success: false, error: data?.error || 'Failed to generate presigned audio URL' };
    }
    return {
      success: true,
      uploadUrl: data.uploadUrl,
      publicUrl: data.publicUrl,
      contentType: data.contentType,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error requesting presigned ticket' };
  }
}

export async function uploadAudioToPresignedUrl(
  uploadUrl: string,
  fileUri: string,
  contentType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In React Native fetch, PUT binary file uri directly
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: {
        uri: fileUri,
        type: contentType,
        name: fileUri.split('/').pop() || 'track.opus',
      } as any,
    });

    if (!res.ok) {
      return { success: false, error: `Upload to storage rejected (HTTP ${res.status})` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to stream audio file' };
  }
}

export interface AddTrackPayload {
  title: string;
  artist: string;
  album?: string | null;
  audio_url: string;
  cover_url?: string | null;
  duration?: string | null;
  duration_sec?: number | null;
}

export async function addTrack(
  endpoint: string,
  token: string,
  payload: AddTrackPayload
): Promise<{ success: boolean; error?: string; track?: DbTrack }> {
  try {
    const formatted = endpoint.replace(/\/$/, '');
    const res = await fetch(`${formatted}/api/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return { success: false, error: data?.error || 'Failed to add track' };
    }
    return { success: true, track: data.track };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}
