import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb, guestbookEntries } from '@/lib/db';
import { getServerSession } from '@/lib/serverSession';

export async function GET() {
  const db = getDb();
  if (!db) return Response.json({ entries: [] });
  try {
    const entries = await db.select().from(guestbookEntries).orderBy(desc(guestbookEntries.created_at)).limit(100);
    return Response.json({ entries });
  } catch (error) {
    console.error('Error reading guestbook:', error);
    return Response.json({ error: 'Failed to read guestbook' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.honeypot) return Response.json({ success: true });
    const content = String(body.content || '').trim();
    let authorName = String(body.authorName || '').trim() || 'guest';
    const session = await getServerSession();
    if (session) authorName = session.username;
    if (!content) return Response.json({ error: 'Please leave a message.' }, { status: 400 });
    if (content.length > 1000) return Response.json({ error: 'Your message is too long.' }, { status: 400 });
    const db = getDb();
    if (!db) return Response.json({ error: 'Guestbook is not available right now.' }, { status: 503 });
    const [entry] = await db
      .insert(guestbookEntries)
      .values({ author_name: authorName.slice(0, 50), content })
      .returning();
    return Response.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error('Error signing guestbook:', error);
    return Response.json({ error: 'Failed to sign the guestbook.' }, { status: 500 });
  }
}

/**
 * PATCH /api/guestbook - Operator reply to a guestbook entry
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized: Operator session required.' }, { status: 401 });
    }

    const body = await request.json();
    const entryId = String(body.id || '').trim();
    const replyContent = String(body.replyContent || '').trim();

    if (!entryId) {
      return Response.json({ error: 'Entry ID is required.' }, { status: 400 });
    }
    if (!replyContent) {
      return Response.json({ error: 'Reply content cannot be empty.' }, { status: 400 });
    }

    const db = getDb();
    if (!db) return Response.json({ error: 'Database unavailable.' }, { status: 503 });

    const nowIso = new Date().toISOString();
    const [updated] = await db
      .update(guestbookEntries)
      .set({
        reply_content: replyContent,
        replied_at: new Date(nowIso) as any,
      })
      .where(eq(guestbookEntries.id, entryId))
      .returning();

    return Response.json({ success: true, entry: updated }, { status: 200 });
  } catch (error) {
    console.error('Error replying to guestbook entry:', error);
    return Response.json({ error: 'Failed to reply to guestbook entry.' }, { status: 500 });
  }
}
