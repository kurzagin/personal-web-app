'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, BookOpen, ExternalLink, RefreshCw, Send, CornerDownRight, Check } from 'lucide-react';
import type { DbComment, DbGuestbookEntry } from '@/lib/db';

export interface CommentWithPost extends DbComment {
  post_content?: string | null;
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
  initialReplies,
  initialGuestbook,
}: {
  operatorName: string;
  initialReplies: CommentWithPost[];
  initialGuestbook: DbGuestbookEntry[];
}) {
  const [activeTab, setActiveTab] = useState<'replies' | 'guestbook'>('replies');
  const [replies, setReplies] = useState<CommentWithPost[]>(initialReplies);
  const [guestbook, setGuestbook] = useState<DbGuestbookEntry[]>(initialGuestbook);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
          <span className="jp-label">受信箱</span> — active transmission feed for comments &amp; guestbook entries
        </div>
      </div>

      <section className="section" style={{ maxWidth: '820px', margin: '0 auto', paddingTop: '24px' }}>
        {/* Tab switch header */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
            marginBottom: '24px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('replies')}
              style={{
                background: activeTab === 'replies' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'replies' ? 'var(--accent)' : 'var(--text-2)',
                border: `1px solid ${activeTab === 'replies' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '2px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontFamily: 'var(--mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageSquare size={13} />
              <span>replies &amp; comments</span>
              <span
                style={{
                  background: 'var(--bg-2)',
                  color: 'var(--text-1)',
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: '2px',
                }}
              >
                {replies.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guestbook')}
              style={{
                background: activeTab === 'guestbook' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'guestbook' ? 'var(--accent)' : 'var(--text-2)',
                border: `1px solid ${activeTab === 'guestbook' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '2px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontFamily: 'var(--mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <BookOpen size={13} />
              <span>guestbook</span>
              <span
                style={{
                  background: 'var(--bg-2)',
                  color: 'var(--text-1)',
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: '2px',
                }}
              >
                {guestbook.length}
              </span>
            </button>
          </div>

          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-3)' }}>
            operator: <span style={{ color: 'var(--accent)' }}>@{operatorName}</span>
          </div>
        </div>

        {/* Tab content: Replies */}
        {activeTab === 'replies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {replies.length === 0 ? (
              <div className="bracket-card empty-state" style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  NO COMMENTS YET
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--text-3)', margin: '8px 0 0 0' }}>
                  When visitors comment on your blog posts, they will show up here.
                </p>
              </div>
            ) : (
              replies.map((comment) => {
                const isReplying = replyingToCommentId === comment.id;
                return (
                  <article
                    key={comment.id}
                    className="bracket-card"
                    style={{
                      padding: '18px 20px',
                      background: 'var(--bg-1)',
                      border: '1px solid var(--border)',
                      position: 'relative',
                    }}
                  >
                    {/* Header: Author + Timestamp */}
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
                      <div>
                        <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>
                          {comment.author_name}
                        </strong>
                        {comment.parent_comment_id && (
                          <span style={{ color: 'var(--text-3)', marginLeft: '6px', fontSize: '0.7rem' }}>
                            [reply in thread]
                          </span>
                        )}
                      </div>
                      <time style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>
                        {formatTimestamp(comment.created_at)}
                      </time>
                    </div>

                    {/* Post context snippet */}
                    {comment.post_content && (
                      <div
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '0.7rem',
                          color: 'var(--text-3)',
                          background: 'var(--bg-0)',
                          padding: '6px 10px',
                          borderRadius: '2px',
                          borderLeft: '2px solid var(--border)',
                          marginBottom: '10px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        on post: &quot;{truncate(comment.post_content, 70)}&quot;
                      </div>
                    )}

                    {/* Content */}
                    <div
                      style={{
                        fontFamily: 'var(--sans)',
                        fontSize: '0.88rem',
                        lineHeight: '1.55',
                        color: 'var(--text-0)',
                        marginBottom: '14px',
                        whiteSpace: 'pre-wrap',
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
                        paddingTop: '10px',
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
                          gap: '5px',
                          padding: '4px 0',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                        }}
                      >
                        <CornerDownRight size={12} />
                        <span>{isReplying ? 'cancel reply' : 'quick reply'}</span>
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
                          marginTop: '12px',
                          paddingTop: '12px',
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
                            padding: '8px 10px',
                            outline: 'none',
                            borderRadius: '2px',
                            resize: 'vertical',
                          }}
                        />

                        {submitError && (
                          <div style={{ color: 'var(--red)', fontSize: '0.72rem', marginTop: '4px' }}>
                            {submitError}
                          </div>
                        )}
                        {submitSuccess && (
                          <div style={{ color: 'var(--accent)', fontSize: '0.72rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                              padding: '5px 14px',
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
        )}

        {/* Tab content: Guestbook */}
        {activeTab === 'guestbook' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {guestbook.length === 0 ? (
              <div className="bracket-card empty-state" style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  GUESTBOOK IS EMPTY
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--text-3)', margin: '8px 0 0 0' }}>
                  No messages recorded in the ledger yet.
                </p>
              </div>
            ) : (
              guestbook.map((entry) => (
                <article
                  key={entry.id}
                  className="bracket-card"
                  style={{
                    padding: '18px 20px',
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
                    <time style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>
                      {formatTimestamp(entry.created_at)}
                    </time>
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: '0.88rem',
                      lineHeight: '1.55',
                      color: 'var(--text-0)',
                      whiteSpace: 'pre-wrap',
                      marginBottom: '12px',
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
