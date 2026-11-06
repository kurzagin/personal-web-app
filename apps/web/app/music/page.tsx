import { desc } from 'drizzle-orm';
import { getDb, tracks as tracksTable, type DbTrack } from '@/lib/db';
import MusicClient from './MusicClient';

export const metadata = { title: 'music — kurzagin' };

export default async function MusicPage() {
  const db = getDb();
  let tracks: DbTrack[] = [];

  if (db) {
    try {
      tracks = await db
        .select()
        .from(tracksTable)
        .orderBy(desc(tracksTable.created_at));
    } catch (err) {
      console.error('Error fetching tracks from D1 database:', err);
    }
  }

  return (
    <MusicClient
      tracks={JSON.parse(JSON.stringify(tracks))}
    />
  );
}
