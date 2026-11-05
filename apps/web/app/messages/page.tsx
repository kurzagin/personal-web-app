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

  const myUsername = (session.username || '').toLowerCase();
  const db = getDb();
  let pendingReplies: CommentWithPost[] = [];
  let allReplies: CommentWithPost[] = [];
  let guestbook: DbGuestbookEntry[] = [];

  if (db) {
    try {
      // 1. Fetch latest comments
      const rawComments = await db
        .select()
        .from(commentsTable)
        .orderBy(desc(commentsTable.created_at))
        .limit(200);

      // Collect parent comment IDs that the operator has already replied to
      const repliedParentCommentIds = new Set<string>();
      for (const c of rawComments) {
        const isOperator = (c.author_name || '').toLowerCase() === myUsername;
        if (isOperator && c.parent_comment_id) {
          repliedParentCommentIds.add(c.parent_comment_id);
        }
      }

      // Filter out comments authored by the operator themselves
      const visitorComments = rawComments.filter(
        (c) => (c.author_name || '').toLowerCase() !== myUsername
      );

      const postIds = Array.from(new Set(visitorComments.map((c) => c.post_id)));
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

      allReplies = visitorComments.map((c) => ({
        ...c,
        post_content: postSnippets[c.post_id] || null,
        is_replied: repliedParentCommentIds.has(c.id),
      }));

      // Unanswered only (comments that have no reply from the operator yet)
      pendingReplies = allReplies.filter((c) => !c.is_replied);

      // 2. Fetch latest guestbook entries (exclude any signed by the operator if applicable)
      const rawGuestbook = await db
        .select()
        .from(guestbookTable)
        .orderBy(desc(guestbookTable.created_at))
        .limit(100);

      guestbook = rawGuestbook.filter(
        (g) => (g.author_name || '').toLowerCase() !== myUsername
      );
    } catch (err) {
      console.error('[messages] Error fetching inbox entries:', err);
    }
  }

  return (
    <MessagesClient
      operatorName={session.username}
      initialPendingReplies={JSON.parse(JSON.stringify(pendingReplies))}
      initialAllReplies={JSON.parse(JSON.stringify(allReplies))}
      initialGuestbook={JSON.parse(JSON.stringify(guestbook))}
    />
  );
}
