-- 0. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 0b. Admin Sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);

-- 1. Site Stats
CREATE TABLE IF NOT EXISTS site_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_visits INTEGER NOT NULL DEFAULT 0
);

-- 2. Games
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  cover_url TEXT,
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Kur Zagin',
  author_handle TEXT NOT NULL DEFAULT '@kurzagin',
  category TEXT NOT NULL DEFAULT 'text',
  anime_meta TEXT,
  game_id TEXT REFERENCES games(id) ON DELETE SET NULL,
  has_media INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  reposts_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_has_media ON posts(has_media, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category, created_at);

-- 4. Post Media
CREATE TABLE IF NOT EXISTS post_media (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'media',
  media_type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_category ON post_media(category, created_at);

-- 5. Comments
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id TEXT,
  author_name TEXT NOT NULL DEFAULT 'guest',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id, created_at);

-- 6. Guestbook Entries
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL DEFAULT 'guest',
  content TEXT NOT NULL,
  reply_content TEXT,
  replied_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_created_at ON guestbook_entries(created_at);

-- 7. Tracks
CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration TEXT DEFAULT '0:00',
  duration_sec INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at);

-- 8. Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_post_likes_post_ip ON post_likes(post_id, ip_hash);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_ip_hash ON post_likes(ip_hash);

-- 9. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Kur Zagin 𒀭𒆳𒍝𒆳',
  handle TEXT NOT NULL DEFAULT '@kurzagin',
  headline TEXT DEFAULT 'System architect, solo developer, and builder of strange but useful things.',
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  theme TEXT NOT NULL DEFAULT 'default',
  location TEXT DEFAULT '35.6614° N, 139.6681° E',
  status_message TEXT DEFAULT 'building tools I wish already existed',
  currently_building TEXT NOT NULL DEFAULT '[]',
  tech_stack TEXT NOT NULL DEFAULT '[]',
  social_links TEXT NOT NULL DEFAULT '[]',
  contact_email TEXT DEFAULT 'venus@kurzagin.com',
  contact_details TEXT NOT NULL DEFAULT '[]',
  contact_note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Anime Watchlist
CREATE TABLE IF NOT EXISTS anime_watchlist (
  id TEXT PRIMARY KEY,
  anilist_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  romaji_title TEXT,
  native_title TEXT,
  cover_url TEXT,
  banner_url TEXT,
  format TEXT DEFAULT 'TV',
  status TEXT NOT NULL DEFAULT 'watching',
  current_episode INTEGER NOT NULL DEFAULT 0,
  total_episodes INTEGER,
  score INTEGER,
  genres TEXT NOT NULL DEFAULT '[]',
  studio TEXT,
  season_year INTEGER,
  summary TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_anime_watchlist_status ON anime_watchlist(status);
CREATE INDEX IF NOT EXISTS idx_anime_watchlist_updated_at ON anime_watchlist(updated_at);

-- 11. Anime Reviews
CREATE TABLE IF NOT EXISTS anime_reviews (
  id TEXT PRIMARY KEY,
  anime_id TEXT NOT NULL REFERENCES anime_watchlist(id) ON DELETE CASCADE,
  episode INTEGER,
  review_type TEXT NOT NULL DEFAULT 'mid_watch',
  content TEXT NOT NULL,
  rating INTEGER,
  has_spoilers INTEGER NOT NULL DEFAULT 0,
  share_to_feed INTEGER NOT NULL DEFAULT 0,
  post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_anime_reviews_anime_id ON anime_reviews(anime_id, created_at);
CREATE INDEX IF NOT EXISTS idx_anime_reviews_review_type ON anime_reviews(review_type);

-- 12. Wiki Visual References
CREATE TABLE IF NOT EXISTS wiki_visual_references (
  id TEXT PRIMARY KEY,
  novel_slug TEXT NOT NULL,
  category TEXT NOT NULL,
  entry_slug TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wiki_visual_references_entry ON wiki_visual_references(novel_slug, category, entry_slug);

-- 13. Media Assets
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL UNIQUE,
  storage TEXT NOT NULL DEFAULT 'r2',
  media_type TEXT NOT NULL DEFAULT 'image',
  status TEXT NOT NULL DEFAULT 'active',
  size_bytes INTEGER,
  mime_type TEXT,
  detached_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_media_type ON media_assets(media_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);
