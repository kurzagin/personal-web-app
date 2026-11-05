'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  BookOpen,
  ExternalLink,
  Send,
  CornerDownRight,
  Check,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import type { DbComment, DbGuestbookEntry } from '@/lib/db';

export interface CommentWithPost extends DbComment {
  post_content?: string | null;
  is_replied?: boolean;
}

function formatTimestamp(val: string | Date | null | undefined): string {
  if (!val) return 'unknown';
  try {
    const d = new Date(val);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  } catch {
    return String(val);
  }
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '';
  const trimmed = text.replace(/<[^>]*>/g, '').trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max) + '...';
}

export default function MessagesClient({
  operatorName,
  initialPendingReplies,
  initialAllReplies,
  initialGuestbook,
}: {
  operatorName: string;
  initialPendingReplies: CommentWithPost[];
  initialAllReplies: CommentWithPost[];
  initialGuestbook: DbGuestbookEntry[];
}) {
  const [activeTab, setActiveTab] = useState<'replies' | 'guestbook'>('replies');
  const [repliesFilter, setRepliesFilter] = useState<'pending' | 'all'>('pending');
  const [guestbookFilter, setGuestbookFilter] = useState<'pending' | 'all'>('pending');
  const [allReplies, setAllReplies] = useState<CommentWithPost[]>(initialAllReplies);
  const [guestbook, setGuestbook] = useState<DbGuestbookEntry[]>(initialGuestbook);

  // Comment reply state
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [commentReplyContent, setCommentReplyContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Guestbook reply state
  const [replyingToGuestbookId, setReplyingToGuestbookId] = useState<string | null>(null);
  const [guestbookReplyContent, setGuestbookReplyContent] = useState('');
  const [isSubmittingGuestbook, setIsSubmittingGuestbook] = useState(false);
  const [guestbookSuccess, setGuestbookSuccess] = useState<string | null>(null);
  const [guestbookError, setGuestbookError] = useState<string | null>(null);

  const pendingReplies = allReplies.filter((c) => !c.is_replied);
  const displayedReplies = repliesFilter === 'pending' ? pendingReplies : allReplies;

  const pendingGuestbook = guestbook.filter((g) => !g.reply_content);
  const displayedGuestbook = guestbookFilter === 'pending' ? pendingGuestbook : guestbook;

  async function handleCommentReply(comment: CommentWithPost) {
    if (!commentReplyContent.trim()) return;
    setIsSubmittingComment(true);
    setCommentError(null);
    setCommentSuccess(null);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: comment.post_id,
          parentCommentId: comment.id,
          content: commentReplyContent.trim(),
          authorName: operatorName || 'kurzagin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }

      setAllReplies((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, is_replied: true } : c))
      );

      setCommentSuccess('Reply posted successfully!');
      setCommentReplyContent('');
      setTimeout(() => {
        setReplyingToCommentId(null);
        setCommentSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to send reply');
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleGuestbookReply(entry: DbGuestbookEntry) {
    if (!guestbookReplyContent.trim()) return;
    setIsSubmittingGuestbook(true);
    setGuestbookError(null);
    setGuestbookSuccess(null);

    try {
      const res = await fetch('/api/guestbook', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          replyContent: guestbookReplyContent.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save reply');
      }

      setGuestbook((prev) =>
        prev.map((g) =>
          g.id === entry.id
            ? { ...g, reply_content: guestbookReplyContent.trim(), replied_at: new Date().toISOString() as any }
            : g
        )
      );

      setGuestbookSuccess('Reply saved to guestbook!');
      setGuestbookReplyContent('');
      setTimeout(() => {
        setReplyingToGuestbookId(null);
        setGuestbookSuccess(null);
      }, 1500);
    } catch (err: any) {
      setGuestbookError(err.message || 'Failed to save reply');
    } finally {
      setIsSubmittingGuestbook(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>
          <span className="hl">operator</span> messages
        </h1>
        <div className="page-sub">
          <span className="jp-label">受信箱</span> — visitor transmissions requiring operator attention
        </div>
      </div>

      <section className="section" style={{ maxWidth: '820px', margin: '0 auto', paddingTop: '16px' }}>
        {/* Operator status bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--mono)',
            fontSize: '0.72rem',
            color: 'var(--text-3)',
            marginBottom: '14px',
            padding: '0 2px',
          }}
        >
          <div>
            operator: <span style={{ color: 'var(--accent)' }}>@{operatorName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: pendingReplies.length + pendingGuestbook.length > 0 ? 'var(--accent)' : 'var(--border-subtle)',
                display: 'inline-block',
              }}
            />
            <span>{pendingReplies.length + pendingGuestbook.length} waiting</span>
          </div>
        </div>

        {/* Responsive Segmented Tab Control */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('replies')}
            style={{
              background: activeTab === 'replies' ? 'var(--accent-glow)' : 'var(--bg-0)',
              color: activeTab === 'replies' ? 'var(--accent)' : 'var(--text-2)',
              border: `1px solid ${activeTab === 'replies' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '3px',
              padding: '10px 8px',
              fontSize: '0.8rem',
              fontFamily: 'var(--mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              width: '100%',
            }}
          >
            <MessageSquare size={14} />
            <span>replies</span>
            <span
              style={{
                background: activeTab === 'replies' ? 'var(--accent)' : 'var(--bg-2)',
                color: activeTab === 'replies' ? 'var(--bg-0)' : 'var(--text-1)',
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {pendingReplies.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guestbook')}
            style={{
              background: activeTab === 'guestbook' ? 'var(--accent-glow)' : 'var(--bg-0)',
              color: activeTab === 'guestbook' ? 'var(--accent)' : 'var(--text-2)',
              border: `1px solid ${activeTab === 'guestbook' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '3px',
              padding: '10px 8px',
              fontSize: '0.8rem',
              fontFamily: 'var(--mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              width: '100%',
            }}
          >
            <BookOpen size={14} />
            <span>guestbook</span>
            <span
              style={{
                background: activeTab === 'guestbook' ? 'var(--accent)' : 'var(--bg-2)',
                color: activeTab === 'guestbook' ? 'var(--bg-0)' : 'var(--text-1)',
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {pendingGuestbook.length}
            </span>
          </button>
        </div>

        {/* Tab content: Replies */}
        {activeTab === 'replies' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                fontFamily: 'var(--mono)',
                fontSize: '0.72rem',
                padding: '0 2px',
              }}
            >
              <div style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={11} />
                <span>filter:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setRepliesFilter('pending')}
                  style={{
                    background: repliesFilter === 'pending' ? 'var(--bg-2)' : 'transparent',
                    border: `1px solid ${repliesFilter === 'pending' ? 'var(--border)' : 'transparent'}`,
                    color: repliesFilter === 'pending' ? 'var(--text-0)' : 'var(--text-3)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    padding: '3px 8px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  unanswered ({pendingReplies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRepliesFilter('all')}
                  style={{
                    background: repliesFilter === 'all' ? 'var(--bg-2)' : 'transparent',
                    border: `1px solid ${repliesFilter === 'all' ? 'var(--border)' : 'transparent'}`,
                    color: repliesFilter === 'all' ? 'var(--text-0)' : 'var(--text-3)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    padding: '3px 8px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  all ({allReplies.length})
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {displayedReplies.length === 0 ? (
                <div className="bracket-card empty-state" style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text-1)' }}>
                    {repliesFilter === 'pending' ? 'INBOX CLEAR' : 'NO VISITOR COMMENTS'}
                  </div>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--text-3)', margin: '6px 0 0 0' }}>
                    {repliesFilter === 'pending'
                      ? 'All visitor comments have been answered by you.'
                      : 'No comments from visitors yet.'}
                  </p>
                </div>
              ) : (
                displayedReplies.map((comment) => {
                  const isReplying = replyingToCommentId === comment.id;
                  return (
                    <article
                      key={comment.id}
                      className="bracket-card"
                      style={{
                        padding: '16px',
                        background: 'var(--bg-1)',
                        border: '1px solid var(--border)',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px',
                          gap: '8px',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                            {comment.author_name}
                          </span>
                          {comment.parent_comment_id && (
                            <span style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '0.68rem', marginLeft: '6px' }}>
                              [in-thread]
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {comment.is_replied ? (
                            <span
                              style={{
                                color: 'var(--accent)',
                                fontSize: '0.65rem',
                                fontFamily: 'var(--mono)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'var(--accent-glow)',
                                padding: '1px 6px',
                                borderRadius: '2px',
                              }}
                            >
                              <Check size={10} /> replied
                            </span>
                          ) : (
                            <span
                              style={{
                                color: 'var(--text-3)',
                                fontSize: '0.65rem',
                                fontFamily: 'var(--mono)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Clock size={10} /> waiting
                            </span>
                          )}
                          <time style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '0.68rem' }}>
                            {formatTimestamp(comment.created_at)}
                          </time>
                        </div>
                      </div>

                      {comment.post_content && (
                        <div
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: '0.68rem',
                            color: 'var(--text-3)',
                            background: 'var(--bg-0)',
                            padding: '6px 8px',
                            borderRadius: '2px',
                            borderLeft: '2px solid var(--border)',
                            marginBottom: '10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          on post: &quot;{truncate(comment.post_content, 60)}&quot;
                        </div>
                      )}

                      <div
                        style={{
                          fontFamily: 'var(--sans)',
                          fontSize: '0.86rem',
                          lineHeight: '1.5',
                          color: 'var(--text-0)',
                          marginBottom: '12px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {comment.content}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '8px',
                          fontFamily: 'var(--mono)',
                          fontSize: '0.72rem',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToCommentId(isReplying ? null : comment.id);
                            setCommentReplyContent('');
                            setCommentError(null);
                            setCommentSuccess(null);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isReplying ? 'var(--accent)' : 'var(--text-2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 0',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                          }}
                        >
                          <CornerDownRight size={12} />
                          <span>{isReplying ? 'cancel' : comment.is_replied ? 'reply again' : 'quick reply'}</span>
                        </button>

                        <Link
                          href={`/post/${comment.post_id}#comment-${comment.id}`}
                          target="_blank"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--text-3)',
                            textDecoration: 'none',
                          }}
                        >
                          <span>open thread</span>
                          <ExternalLink size={11} />
                        </Link>
                      </div>

                      {isReplying && (
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px dashed var(--border)',
                          }}
                        >
                          <textarea
                            rows={3}
                            value={commentReplyContent}
                            onChange={(e) => setCommentReplyContent(e.target.value)}
                            placeholder={`Reply to ${comment.author_name} as @${operatorName}...`}
                            style={{
                              width: '100%',
                              background: 'var(--bg-0)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-0)',
                              fontFamily: 'var(--mono)',
                              fontSize: '0.8rem',
                              padding: '8px',
                              outline: 'none',
                              borderRadius: '2px',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />

                          {commentError && (
                            <div style={{ color: 'var(--red)', fontSize: '0.72rem', marginTop: '4px' }}>
                              {commentError}
                            </div>
                          )}
                          {commentSuccess && (
                            <div
                              style={{
                                color: 'var(--accent)',
                                fontSize: '0.72rem',
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Check size={12} /> {commentSuccess}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button
                              type="button"
                              disabled={isSubmittingComment || !commentReplyContent.trim()}
                              onClick={() => handleCommentReply(comment)}
                              className="post-btn"
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.75rem',
                                opacity: isSubmittingComment || !commentReplyContent.trim() ? 0.5 : 1,
                              }}
                            >
                              <Send size={11} style={{ marginRight: '4px' }} />
                              <span>{isSubmittingComment ? 'sending...' : 'send reply'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab content: Guestbook */}
        {activeTab === 'guestbook' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                fontFamily: 'var(--mono)',
                fontSize: '0.72rem',
                padding: '0 2px',
              }}
            >
              <div style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={11} />
                <span>filter:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setGuestbookFilter('pending')}
                  style={{
                    background: guestbookFilter === 'pending' ? 'var(--bg-2)' : 'transparent',
                    border: `1px solid ${guestbookFilter === 'pending' ? 'var(--border)' : 'transparent'}`,
                    color: guestbookFilter === 'pending' ? 'var(--text-0)' : 'var(--text-3)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    padding: '3px 8px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  unanswered ({pendingGuestbook.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGuestbookFilter('all')}
                  style={{
                    background: guestbookFilter === 'all' ? 'var(--bg-2)' : 'transparent',
                    border: `1px solid ${guestbookFilter === 'all' ? 'var(--border)' : 'transparent'}`,
                    color: guestbookFilter === 'all' ? 'var(--text-0)' : 'var(--text-3)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    padding: '3px 8px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  all ({guestbook.length})
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {displayedGuestbook.length === 0 ? (
                <div className="bracket-card empty-state" style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text-1)' }}>
                    {guestbookFilter === 'pending' ? 'ALL ENTRIES ANSWERED' : 'GUESTBOOK IS EMPTY'}
                  </div>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--text-3)', margin: '6px 0 0 0' }}>
                    {guestbookFilter === 'pending'
                      ? 'You have replied to all guestbook visitor signatures.'
                      : 'No visitor entries recorded in the ledger yet.'}
                  </p>
                </div>
              ) : (
                displayedGuestbook.map((entry) => {
                  const isReplying = replyingToGuestbookId === entry.id;
                  const hasReplied = Boolean(entry.reply_content);
                  return (
                    <article
                      key={entry.id}
                      className="bracket-card"
                      style={{
                        padding: '16px',
                        background: 'var(--bg-1)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <strong style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {entry.author_name}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {hasReplied ? (
                            <span
                              style={{
                                color: 'var(--accent)',
                                fontSize: '0.65rem',
                                fontFamily: 'var(--mono)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'var(--accent-glow)',
                                padding: '1px 6px',
                                borderRadius: '2px',
                              }}
                            >
                              <Check size={10} /> replied
                            </span>
                          ) : (
                            <span
                              style={{
                                color: 'var(--text-3)',
                                fontSize: '0.65rem',
                                fontFamily: 'var(--mono)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Clock size={10} /> waiting
                            </span>
                          )}
                          <time style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '0.68rem' }}>
                            {formatTimestamp(entry.created_at)}
                          </time>
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--sans)',
                          fontSize: '0.86rem',
                          lineHeight: '1.5',
                          color: 'var(--text-0)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          marginBottom: '10px',
                        }}
                      >
                        {entry.content}
                      </div>

                      {/* Display existing operator reply if present */}
                      {entry.reply_content && (
                        <div
                          style={{
                            marginTop: '10px',
                            marginBottom: '10px',
                            padding: '8px 12px',
                            background: 'var(--bg-0)',
                            borderLeft: '2px solid var(--accent)',
                            borderRadius: '2px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px',
                              fontFamily: 'var(--mono)',
                              fontSize: '0.68rem',
                            }}
                          >
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                              ↳ @{operatorName} [operator reply]
                            </span>
                            {entry.replied_at && (
                              <time style={{ color: 'var(--text-3)', fontSize: '0.65rem' }}>
                                {formatTimestamp(entry.replied_at)}
                              </time>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-1)', lineHeight: '1.5' }}>
                            {entry.reply_content}
                          </p>
                        </div>
                      )}

                      {/* Actions row */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '8px',
                          fontFamily: 'var(--mono)',
                          fontSize: '0.72rem',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToGuestbookId(isReplying ? null : entry.id);
                            setGuestbookReplyContent(entry.reply_content || '');
                            setGuestbookError(null);
                            setGuestbookSuccess(null);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isReplying ? 'var(--accent)' : 'var(--text-2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 0',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                          }}
                        >
                          <CornerDownRight size={12} />
                          <span>{isReplying ? 'cancel' : hasReplied ? 'edit reply' : 'quick reply'}</span>
                        </button>

                        <Link
                          href="/guestbook"
                          target="_blank"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--text-3)',
                            textDecoration: 'none',
                          }}
                        >
                          <span>open guestbook</span>
                          <ExternalLink size={11} />
                        </Link>
                      </div>

                      {/* Quick reply inline box for guestbook */}
                      {isReplying && (
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px dashed var(--border)',
                          }}
                        >
                          <textarea
                            rows={3}
                            value={guestbookReplyContent}
                            onChange={(e) => setGuestbookReplyContent(e.target.value)}
                            placeholder={`Reply to ${entry.author_name} as @${operatorName}...`}
                            style={{
                              width: '100%',
                              background: 'var(--bg-0)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-0)',
                              fontFamily: 'var(--mono)',
                              fontSize: '0.8rem',
                              padding: '8px',
                              outline: 'none',
                              borderRadius: '2px',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />

                          {guestbookError && (
                            <div style={{ color: 'var(--red)', fontSize: '0.72rem', marginTop: '4px' }}>
                              {guestbookError}
                            </div>
                          )}
                          {guestbookSuccess && (
                            <div
                              style={{
                                color: 'var(--accent)',
                                fontSize: '0.72rem',
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Check size={12} /> {guestbookSuccess}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button
                              type="button"
                              disabled={isSubmittingGuestbook || !guestbookReplyContent.trim()}
                              onClick={() => handleGuestbookReply(entry)}
                              className="post-btn"
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.75rem',
                                opacity: isSubmittingGuestbook || !guestbookReplyContent.trim() ? 0.5 : 1,
                              }}
                            >
                              <Send size={11} style={{ marginRight: '4px' }} />
                              <span>{isSubmittingGuestbook ? 'saving...' : 'save reply'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
