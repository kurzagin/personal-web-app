import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type {
  AnimePostMeta,
  GameMeta,
  ProjectEntry,
  SocialLinkEntry,
  ContactDetailEntry,
} from './types';

export type {
  AnimePostMeta,
  GameMeta,
  ProjectEntry,
  SocialLinkEntry,
  ContactDetailEntry,
};

// Helper for generating standard UUID string if not provided
const uuidGenerator = () => sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`;

// 0. Admin Users Table (For authenticating operator from Android App)
export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 0b. Admin Sessions Table (Revocable auth tokens stored in D1)
export const adminSessions = sqliteTable('admin_sessions', {
  token: text('token').primaryKey(),
  user_id: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  expires_at: text('expires_at').notNull(),
});

// 1. Site Stats
export const siteStats = sqliteTable('site_stats', {
  id: integer('id').primaryKey().default(1),
  total_visits: integer('total_visits').notNull().default(0),
});

// 2. Games Table
export const games = sqliteTable('games', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  cover_url: text('cover_url'),
  meta: text('meta', { mode: 'json' }).$type<GameMeta>().default({}).notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 3. Posts Table
export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    author_name: text('author_name').default('Kur Zagin').notNull(),
    author_handle: text('author_handle').default('@kurzagin').notNull(),
    category: text('category').default('text').notNull(), // 'text' | 'media' | 'anime'
    anime_meta: text('anime_meta', { mode: 'json' }).$type<AnimePostMeta>(),
    game_id: text('game_id').references(() => games.id, { onDelete: 'set null' }),
    has_media: integer('has_media', { mode: 'boolean' }).default(false).notNull(),
    likes_count: integer('likes_count').default(0).notNull(),
    reposts_count: integer('reposts_count').default(0).notNull(),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    index('idx_posts_user_id').on(table.user_id),
    index('idx_posts_created_at').on(table.created_at),
    index('idx_posts_has_media').on(table.has_media, table.created_at),
    index('idx_posts_category').on(table.category, table.created_at),
  ]
);

// 4. Post Media Table
export const postMedia = sqliteTable(
  'post_media',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    post_id: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    category: text('category').default('media').notNull(),
    media_type: text('media_type').default('image').notNull(),
    url: text('url').notNull(),
    alt_text: text('alt_text'),
    width: integer('width'),
    height: integer('height'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    index('idx_post_media_post_id').on(table.post_id),
    index('idx_post_media_category').on(table.category, table.created_at),
  ]
);

// 5. Comments Table
export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    post_id: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    parent_comment_id: text('parent_comment_id'),
    author_name: text('author_name').default('guest').notNull(),
    content: text('content').notNull(),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    index('idx_comments_post_id').on(table.post_id, table.created_at),
    index('idx_comments_parent_id').on(table.parent_comment_id, table.created_at),
  ]
);

// 6. Guestbook Entries
export const guestbookEntries = sqliteTable(
  'guestbook_entries',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    author_name: text('author_name').default('guest').notNull(),
    content: text('content').notNull(),
    reply_content: text('reply_content'),
    replied_at: text('replied_at'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [index('idx_guestbook_entries_created_at').on(table.created_at)]
);

// 7. Tracks Table
export const tracks = sqliteTable(
  'tracks',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    artist: text('artist').notNull(),
    album: text('album'),
    audio_url: text('audio_url').notNull(),
    cover_url: text('cover_url'),
    duration: text('duration').default('0:00'),
    duration_sec: integer('duration_sec').default(0),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [index('idx_tracks_created_at').on(table.created_at)]
);

// 8. Post Likes Table
export const postLikes = sqliteTable(
  'post_likes',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    post_id: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    ip_hash: text('ip_hash').notNull(),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    uniqueIndex('uq_post_likes_post_ip').on(table.post_id, table.ip_hash),
    index('idx_post_likes_post_id').on(table.post_id),
    index('idx_post_likes_ip_hash').on(table.ip_hash),
  ]
);

// 9. Profiles Table
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().default('default'),
  name: text('name').notNull().default('Kur Zagin 𒀭𒆳𒍝𒆳'),
  handle: text('handle').notNull().default('@kurzagin'),
  headline: text('headline').default('System architect, solo developer, and builder of strange but useful things.'),
  bio: text('bio').default('I design products where software, knowledge systems, AI, and immersive interfaces overlap.'),
  avatar_url: text('avatar_url'),
  banner_url: text('banner_url'),
  theme: text('theme').notNull().default('default'),
  location: text('location').default('35.6614° N, 139.6681° E'),
  status_message: text('status_message').default('building tools I wish already existed'),
  currently_building: text('currently_building', { mode: 'json' }).$type<ProjectEntry[]>().default([]).notNull(),
  tech_stack: text('tech_stack', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  social_links: text('social_links', { mode: 'json' }).$type<SocialLinkEntry[]>().default([]).notNull(),
  contact_email: text('contact_email').default('venus@kurzagin.com'),
  contact_details: text('contact_details', { mode: 'json' }).$type<ContactDetailEntry[]>().default([]).notNull(),
  contact_note: text('contact_note').default('Ideas, feedback, technical conversations, and unusual collaborations are welcome ✨'),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 10. Anime Watchlist Table
export const animeWatchlist = sqliteTable(
  'anime_watchlist',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    anilist_id: integer('anilist_id').notNull().unique(),
    title: text('title').notNull(),
    romaji_title: text('romaji_title'),
    native_title: text('native_title'),
    cover_url: text('cover_url'),
    banner_url: text('banner_url'),
    format: text('format').default('TV'),
    status: text('status').default('watching').notNull(),
    current_episode: integer('current_episode').default(0).notNull(),
    total_episodes: integer('total_episodes'),
    score: integer('score'),
    genres: text('genres', { mode: 'json' }).$type<string[]>().default([]).notNull(),
    studio: text('studio'),
    season_year: integer('season_year'),
    summary: text('summary'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    index('idx_anime_watchlist_status').on(table.status),
    index('idx_anime_watchlist_updated_at').on(table.updated_at),
  ]
);

// 11. Anime Reviews Table
export const animeReviews = sqliteTable(
  'anime_reviews',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    anime_id: text('anime_id')
      .notNull()
      .references(() => animeWatchlist.id, { onDelete: 'cascade' }),
    episode: integer('episode'),
    review_type: text('review_type').default('mid_watch').notNull(),
    content: text('content').notNull(),
    rating: integer('rating'),
    has_spoilers: integer('has_spoilers', { mode: 'boolean' }).default(false).notNull(),
    share_to_feed: integer('share_to_feed', { mode: 'boolean' }).default(false).notNull(),
    post_id: text('post_id').references(() => posts.id, { onDelete: 'set null' }),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    index('idx_anime_reviews_anime_id').on(table.anime_id, table.created_at),
    index('idx_anime_reviews_review_type').on(table.review_type),
  ]
);

// 11b. Wiki Visual References Table
export const wikiVisualReferences = sqliteTable(
  'wiki_visual_references',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    novel_slug: text('novel_slug').notNull(),
    category: text('category').notNull(),
    entry_slug: text('entry_slug').notNull(),
    url: text('url').notNull(),
    storage_key: text('storage_key').notNull(),
    alt_text: text('alt_text'),
    caption: text('caption'),
    source: text('source'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    index('idx_wiki_visual_references_entry').on(table.novel_slug, table.category, table.entry_slug),
  ]
);

export type WikiVisualReference = typeof wikiVisualReferences.$inferSelect;
export type NewWikiVisualReference = typeof wikiVisualReferences.$inferInsert;

// 12. Media Assets Registry
export const mediaAssets = sqliteTable(
  'media_assets',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    key: text('key').notNull().unique(),
    url: text('url').notNull().unique(),
    storage: text('storage').default('r2').notNull(),
    media_type: text('media_type').default('image').notNull(),
    status: text('status').default('active').notNull(),
    size_bytes: integer('size_bytes'),
    mime_type: text('mime_type'),
    detached_at: text('detached_at'),
    deleted_at: text('deleted_at'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    index('idx_media_assets_status').on(table.status),
    index('idx_media_assets_media_type').on(table.media_type),
    index('idx_media_assets_created_at').on(table.created_at),
  ]
);

export type SiteStats = typeof siteStats.$inferSelect;
export type NewSiteStats = typeof siteStats.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostMedia = typeof postMedia.$inferSelect;
export type NewPostMedia = typeof postMedia.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type GuestbookEntry = typeof guestbookEntries.$inferSelect;
export type NewGuestbookEntry = typeof guestbookEntries.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type AnimeWatchlistItem = typeof animeWatchlist.$inferSelect;
export type NewAnimeWatchlistItem = typeof animeWatchlist.$inferInsert;
export type AnimeReview = typeof animeReviews.$inferSelect;
export type NewAnimeReview = typeof animeReviews.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;

