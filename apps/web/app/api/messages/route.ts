import { connection, type NextRequest } from 'next/server';
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

export interface CommentWithPost extends DbComment {
  post_content?: string | null;
  is_replied?: boolean;
}

export async function GET(request: NextRequest) {
  await connection();

  const session = await getServerSession();
  if (!session) {
    return Response.json(
      { error: 'Unauthorized: Operator authentication required' },
      { status: 401 }
    );
  }

  const myUsername = (session.username || '').toLowerCase();
  const db = getDb();
  if (!db) {
    return Response.json({ error: 'Database unavailable' }, { status: 503 });
  }

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

    const allReplies: CommentWithPost[] = visitorComments.map((c) => ({
      ...c,
      post_content: postSnippets[c.post_id] || null,
      is_replied: repliedParentCommentIds.has(c.id),
    }));

    const pendingReplies = allReplies.filter((c) => !c.is_replied);

    // 2. Fetch latest guestbook entries
    const rawGuestbook = await db
      .select()
      .from(guestbookTable)
      .orderBy(desc(guestbookTable.created_at))
      .limit(100);

    const guestbook = rawGuestbook.filter(
      (g) => (g.author_name || '').toLowerCase() !== myUsername
    );
    const pendingGuestbook = guestbook.filter((g) => !g.reply_content);

    return Response.json({
      success: true,
      operatorUser: session.username,
      pendingReplies,
      allReplies,
      guestbook,
      pendingGuestbook,
    });
  } catch (err: any) {
    console.error('[api/messages] Error fetching inbox messages:', err);
    return Response.json(
      { error: err?.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
