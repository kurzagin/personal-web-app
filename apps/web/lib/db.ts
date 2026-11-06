import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import { getD1 } from './d1';

export * from '../db/schema';

export type DbPost = schema.Post;
export type DbPostMedia = schema.PostMedia;
export type DbComment = schema.Comment;
export type DbGuestbookEntry = schema.GuestbookEntry;
export type DbAdminUser = schema.AdminUser;
export type DbTrack = schema.Track;
export type DbPostLike = schema.PostLike;
export type DbProfile = schema.Profile;
export type DbAnimeWatchlistItem = schema.AnimeWatchlistItem;
export type DbAnimeReview = schema.AnimeReview;
export type AnimePostMeta = schema.AnimePostMeta;
export type DbMediaAsset = schema.MediaAsset;
export type WikiVisualReference = schema.WikiVisualReference;

export async function incrementSiteVisits(): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  try {
    const result = await db
      .insert(schema.siteStats)
      .values({ id: 1, total_visits: 1 })
      .onConflictDoUpdate({
        target: schema.siteStats.id,
        set: { total_visits: sql`${schema.siteStats.total_visits} + 1` },
      })
      .returning({ total_visits: schema.siteStats.total_visits });

    return result[0]?.total_visits ?? 0;
  } catch (err) {
    console.warn('[db] Unable to increment site visits:', err);
    return 0;
  }
}

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: DrizzleDb | null = null;

export const DEFAULT_PROFILE: schema.Profile = {
  id: 'default',
  name: 'Kur Zagin 𒀭𒆳𒍝𒆳',
  handle: '@kurzagin',
  headline: 'System architect, solo developer, and builder of strange but useful things.',
  bio: `I design products where software, knowledge systems, AI, and immersive interfaces overlap.

My work usually begins with a small irritation:
> “Why is this still difficult?”

Then I build the tool I wish already existed.`,
  avatar_url: null,
  banner_url: null,
  theme: 'default',
  location: '35.6614° N, 139.6681° E',
  status_message: 'building tools I wish already existed',
  currently_building: [
    {
      title: 'Siduri',
      description: 'An AI companion and knowledge layer designed to understand applications without becoming tightly coupled to them',
      url: 'https://github.com/vxnus-studio/siduri-x',
      badge: 'Active',
    },
    {
      title: 'e-teyvat',
      description: 'A structured and immersive Genshin Impact knowledge platform 🎐',
      url: 'https://github.com/vxnus-studio/e-teyvat',
      badge: 'Active',
    },
    {
      title: 'Experimental Creator Tools',
      description: 'Tools for creators, media workflows, archives, and versioned knowledge',
      url: 'https://github.com/kurzagin/kurzagin-archive',
      badge: 'Archive',
    },
  ],
  tech_stack: [
    'TypeScript',
    'JavaScript',
    'Python',
    'Rust',
    'Next.js',
    'React',
    'Astro',
    'PostgreSQL',
    'AI workflows',
    'System architecture',
  ],
  social_links: [
    { platform: 'Website', label: 'kurzagin.com', url: 'https://kurzagin.com' },
    { platform: 'VXNUS Studio', label: 'vxnus.xyz', url: 'https://vxnus.xyz' },
    { platform: 'GitHub', label: '@vxnus-studio', url: 'https://github.com/vxnus-studio' },
    { platform: 'X', label: '@kurzagin', url: 'https://x.com/kurzagin' },
  ],
  contact_email: 'venus@kurzagin.com',
  contact_details: [
    { method: 'Email', value: 'venus@kurzagin.com', link: 'mailto:venus@kurzagin.com' },
    { method: 'GitHub Discussions', value: 'vxnus-studio', link: 'https://github.com/vxnus-studio' },
    { method: 'Direct Message', value: '@kurzagin on X', link: 'https://x.com/kurzagin' },
  ],
  contact_note: 'Ideas, feedback, technical conversations, and unusual collaborations are welcome ✨',
  updated_at: '2026-10-02T00:00:00Z',
  created_at: '2026-10-02T00:00:00Z',
};

/**
 * Creates or retrieves a Drizzle ORM client connected to Cloudflare D1
 */
export function getDb(): DrizzleDb {
  if (cachedDb) return cachedDb;

  const d1Client = getD1();

  const d1Shim: any = {
    prepare(query: string) {
      let boundParams: any[] = [];
      return {
        bind(...params: any[]) {
          boundParams = params;
          return this;
        },
        async all() {
          const res = await d1Client.query(query, boundParams);
          return {
            results: res.results || [],
            success: res.success,
            meta: res.meta,
          };
        },
        async raw() {
          const res = await d1Client.query(query, boundParams);
          return (res.results || []).map((row: any) => Object.values(row));
        },
        async run() {
          const res = await d1Client.query(query, boundParams);
          return {
            success: res.success,
            meta: res.meta,
          };
        },
      };
    },
    async batch(statements: any[]) {
      return Promise.all(statements.map((s) => s.all()));
    },
    async exec(query: string) {
      const res = await d1Client.query(query);
      return { count: res.results?.length || 0, duration: 0 };
    },
  };

  cachedDb = drizzle(d1Shim, { schema });
  return cachedDb;
}

export async function getProfile(): Promise<DbProfile> {
  const db = getDb();
  if (!db) return DEFAULT_PROFILE;
  try {
    const res = await db.select().from(schema.profiles).limit(1);
    if (res.length > 0) {
      return res[0];
    }
  } catch (err) {
    console.warn('[db] Unable to fetch profile from D1, using default fallback:', err);
  }
  return DEFAULT_PROFILE;
}
