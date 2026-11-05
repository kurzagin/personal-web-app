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
  const [allReplies, setAllReplies] = useState<CommentWithPost[]>(initialAllReplies);
  const [guestbook] = useState<DbGuestbookEntry[]>(initialGuestbook);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pendingReplies = allReplies.filter((c) => !c.is_replied);
  const displayedReplies = repliesFilter === 'pending' ? pendingReplies : allReplies;

  async function handleQuickReply(comment: CommentWithPost) {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: comment.post_id,
          parentCommentId: comment.id,
          content: replyContent.trim(),
          authorName: operatorName || 'kurzagin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }

      // Mark as replied locally
      setAllReplies((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, is_replied: true } : c))
      );

      setSubmitSuccess('Reply posted successfully!');
      setReplyContent('');
      setTimeout(() => {
        setReplyingToCommentId(null);
        setSubmitSuccess(null);
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
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
                background: pendingReplies.length > 0 ? 'var(--accent)' : 'var(--border-subtle)',
                display: 'inline-block',
              }}
            />
            <span>{pendingReplies.length} waiting</span>
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
              {guestbook.length}
            </span>
          </button>
        </div>

        {/* Tab content: Replies */}
        {activeTab === 'replies' && (
          <div>
            {/* Filter Toggle Sub-row (unanswered vs all) */}
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

            {/* Replies List */}
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
                      {/* Header: Author + Timestamp + Replied Badge */}
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

                      {/* Post context snippet */}
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

                      {/* Content */}
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
                            setReplyingToCommentId(isReplying ? null : comment.id);
                            setReplyContent('');
                            setSubmitError(null);
                            setSubmitSuccess(null);
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

                      {/* Quick reply inline box */}
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
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
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

                          {submitError && (
                            <div style={{ color: 'var(--red)', fontSize: '0.72rem', marginTop: '4px' }}>
                              {submitError}
                            </div>
                          )}
                          {submitSuccess && (
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
                              <Check size={12} /> {submitSuccess}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button
                              type="button"
                              disabled={isSubmitting || !replyContent.trim()}
                              onClick={() => handleQuickReply(comment)}
                              className="post-btn"
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.75rem',
                                opacity: isSubmitting || !replyContent.trim() ? 0.5 : 1,
                              }}
                            >
                              <Send size={11} style={{ marginRight: '4px' }} />
                              <span>{isSubmitting ? 'sending...' : 'send reply'}</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {guestbook.length === 0 ? (
              <div className="bracket-card empty-state" style={{ padding: '36px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  GUESTBOOK IS EMPTY
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--text-3)', margin: '6px 0 0 0' }}>
                  No messages recorded from visitors in the ledger yet.
                </p>
              </div>
            ) : (
              guestbook.map((entry) => (
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
                      fontFamily: 'var(--mono)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      {entry.author_name}
                    </strong>
                    <time style={{ color: 'var(--text-3)', fontSize: '0.68rem' }}>
                      {formatTimestamp(entry.created_at)}
                    </time>
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

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '8px',
                      fontFamily: 'var(--mono)',
                      fontSize: '0.72rem',
                    }}
                  >
                    <Link
                      href="/guestbook"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--text-3)',
                        textDecoration: 'none',
                      }}
                    >
                      <span>open guestbook ledger</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </>
  );
}
