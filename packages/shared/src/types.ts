export interface AnimePostMeta {
  anilist_id?: number;
  anime_id?: string;
  title?: string;
  romaji_title?: string;
  cover_url?: string;
  episode?: number | null;
  score?: number | null;
  review_type?: string;
  has_spoilers?: boolean;
}

export interface GameMeta {
  status?: 'active' | 'paused' | 'completed' | 'archived';
  platform?: string;
  progress?: string;
  stats?: { label: string; value: string }[];
}

export interface ProjectEntry {
  title: string;
  description: string;
  url?: string;
  badge?: string;
}

export interface SocialLinkEntry {
  platform: string;
  label: string;
  url: string;
}

export interface ContactDetailEntry {
  method: string;
  value: string;
  link?: string;
}

export interface PostItem {
  id: string;
  content: string;
  author_name: string;
  author_handle: string;
  category: string;
  anime_meta?: AnimePostMeta | null;
  game_id?: string | null;
  has_media: boolean;
  likes_count: number;
  reposts_count: number;
  created_at: string | Date;
  media?: PostMediaItem[];
}

export interface PostMediaItem {
  id: string;
  post_id: string;
  category: string;
  media_type: string;
  url: string;
  alt_text?: string | null;
  width?: number | null;
  height?: number | null;
  created_at: string | Date;
}

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  audio_url: string;
  cover_url?: string | null;
  duration?: string | null;
  duration_sec?: number | null;
  created_at: string | Date;
}

export interface AnimeWatchlistItem {
  id: string;
  anilist_id: number;
  title: string;
  romaji_title?: string | null;
  native_title?: string | null;
  cover_url?: string | null;
  banner_url?: string | null;
  format?: string | null;
  status: 'watching' | 'completed' | 'rewatching' | 'paused' | 'dropped' | 'planning';
  current_episode: number;
  total_episodes?: number | null;
  score?: number | null;
  genres: string[];
  studio?: string | null;
  season_year?: number | null;
  summary?: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface CommentItem {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  author_name: string;
  content: string;
  created_at: string | Date;
}

export interface GuestbookEntryItem {
  id: string;
  author_name: string;
  content: string;
  created_at: string | Date;
}

export interface ProfileItem {
  id: string;
  name: string;
  handle: string;
  headline?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  theme: string;
  location?: string | null;
  status_message?: string | null;
  currently_building: ProjectEntry[];
  tech_stack: string[];
  social_links: SocialLinkEntry[];
  contact_email?: string | null;
  contact_details: ContactDetailEntry[];
  contact_note?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}
