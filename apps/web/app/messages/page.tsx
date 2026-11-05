import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { desc, inArray } from 'drizzle-orm';
import {
  getDb,
  comments as commentsTable,
  posts as postsTable,
  guestbookEntries as guestbookTable,
  type DbComment,
  type DbGuestbookEntry,
} from '@/lib/db';
import { getServerSession } from '@/lib/serverSession';
import MessagesClient, { type CommentWithPost } from './MessagesClient';

export const metadata = { title: 'messages — kurzagin' };

export default async function MessagesPage() {
  await connection();

  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  const db = getDb();
  let replies: CommentWithPost[] = [];
  let guestbook: DbGuestbookEntry[] = [];

  if (db) {
    try {
      // 1. Fetch latest comments / replies
      const rawComments = await db
        .select()
        .from(commentsTable)
        .orderBy(desc(commentsTable.created_at))
        .limit(100);

      const postIds = Array.from(new Set(rawComments.map((c) => c.post_id)));
      const postSnippets: Record<string, string> = {};

      if (postIds.length > 0) {
        const postsFound = await db
          .select({ id: postsTable.id, content: postsTable.content })
          .from(postsTable)
          .where(inArray(postsTable.id, postIds));

        for (const p of postsFound) {
          postSnippets[p.id] = p.content;
        }
      }

      replies = rawComments.map((c) => ({
        ...c,
        post_content: postSnippets[c.post_id] || null,
      }));

      // 2. Fetch latest guestbook entries
      guestbook = await db
        .select()
        .from(guestbookTable)
        .orderBy(desc(guestbookTable.created_at))
        .limit(100);
    } catch (err) {
      console.error('[messages] Error fetching inbox entries:', err);
    }
  }

  return (
    <MessagesClient
      operatorName={session.username}
      initialReplies={JSON.parse(JSON.stringify(replies))}
      initialGuestbook={JSON.parse(JSON.stringify(guestbook))}
    />
  );
}
