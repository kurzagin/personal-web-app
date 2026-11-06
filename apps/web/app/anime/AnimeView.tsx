// @ts-nocheck
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Tv,
  Plus,
  Search,
  Star,
  MessageSquare,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Film,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Share2,
  Radio,
  Paperclip,
  X,
} from 'lucide-react';
import { css } from '../_ui/css';
import AnimeClient from './AnimeClient';
import './anime.css';

function formatReviewType(type: string) {
  switch (type) {
    case 'first_impression':
      return 'FIRST IMPRESSION';
    case 'mid_watch':
    case 'episodic':
      return 'MID-WATCH LOG';
    case 'final':
      return 'FINAL VERDICT';
    case 'dropped':
      return 'DROPPED LOG';
    case 'rewatch':
      return 'REWATCH LOG';
    default:
      return type.replace(/_/g, ' ').toUpperCase();
  }
}

function formatDate(dateStr: string | Date) {
  try {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${yy}.${mm}.${dd}`;
  } catch {
    return 'recently';
  }
}

function renderReviewContent(content: string) {
  if (!content) return null;
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>
      );
    }
    const alt = match[1] || 'Review image';
    const src = match[2];
    parts.push(
      <span key={`img-${match.index}`} className="review-content-img-wrap">
        <img src={src} alt={alt} className="review-content-img" loading="lazy" />
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
  }

  return parts;
}

interface AnimeViewProps {
  initialStatus: string;
  initialPage: number;
  stats: any;
  allAnimeItems: any[];
  filteredAnimeItems: any[];
  totalFiltered: number;
  totalPages: number;
  safePage: number;
  startIndex: number;
  endIndex: number;
  ssrPaginationItems: (number | string)[];
}

export default function AnimeView({
  initialStatus,
  initialPage,
  stats,
  allAnimeItems,
  filteredAnimeItems,
  totalFiltered,
  totalPages,
  safePage,
  startIndex,
  endIndex,
  ssrPaginationItems,
}: AnimeViewProps) {
  return (
    <>
      <AnimeClient />
  <div className="page-header">
    <div style={css("display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;")}>
      <div>
        <h1><span className="hl">anime</span> log</h1>
        <div className="page-sub">
          <span className="jp-label">アニメ</span> — watching, rewatching, remembering • synced via AniList
        </div>
      </div>

    </div>
  </div>

  {/* STATS BAR */}
  <div className="anime-stats-bar bracket-card reveal">
    <div className="stat-item">
      <span className="stat-num">{stats.total}</span>
      <span className="stat-label">TOTAL LOGGED</span>
    </div>
    <div className="stat-divider"></div>
    <div className="stat-item highlight">
      <span className="stat-num">{stats.watching}</span>
      <span className="stat-label">WATCHING</span>
    </div>
    <div className="stat-divider"></div>
    <div className="stat-item">
      <span className="stat-num">{stats.completed}</span>
      <span className="stat-label">COMPLETED</span>
    </div>
    <div className="stat-divider"></div>
    <div className="stat-item">
      <span className="stat-num">{stats.planning}</span>
      <span className="stat-label">PLANNING</span>
    </div>
    <div className="stat-divider"></div>
    <div className="stat-item">
      <span className="stat-num">{stats.totalEpisodes}</span>
      <span className="stat-label">EPISODES WATCHED</span>
    </div>
  </div>

  {/* FILTER TABS BAR */}
  <div className="anime-filter-bar">
    <button type="button" className={`anime-filter-btn ${initialStatus === 'all' ? 'active' : ''}`} data-status="all" onClick={(e) => { const w = window as any; setAnimeFilter('all') }}>
      // ALL ({stats.total})
    </button>
    <button type="button" className={`anime-filter-btn ${initialStatus === 'watching' ? 'active' : ''}`} data-status="watching" onClick={(e) => { const w = window as any; setAnimeFilter('watching') }}>
      WATCHING ({stats.watching})
    </button>
    <button type="button" className={`anime-filter-btn ${initialStatus === 'completed' ? 'active' : ''}`} data-status="completed" onClick={(e) => { const w = window as any; setAnimeFilter('completed') }}>
      COMPLETED ({stats.completed})
    </button>
    <button type="button" className={`anime-filter-btn ${initialStatus === 'planning' ? 'active' : ''}`} data-status="planning" onClick={(e) => { const w = window as any; setAnimeFilter('planning') }}>
      PLAN TO WATCH ({stats.planning})
    </button>
    {stats.paused > 0 && (
      <button type="button" className={`anime-filter-btn ${initialStatus === 'paused' ? 'active' : ''}`} data-status="paused" onClick={(e) => { const w = window as any; setAnimeFilter('paused') }}>
        PAUSED ({stats.paused})
      </button>
    )}
    {stats.dropped > 0 && (
      <button type="button" className={`anime-filter-btn ${initialStatus === 'dropped' ? 'active' : ''}`} data-status="dropped" onClick={(e) => { const w = window as any; setAnimeFilter('dropped') }}>
        DROPPED ({stats.dropped})
      </button>
    )}
  </div>

  {/* META STATUS / SORT INFO BAR */}
  <div className="anime-meta-bar">
    <div className="anime-meta-left">
      <span className="meta-pill">// SORT: YEAR (NEWEST → OLDEST)</span>
      <span className="meta-pill">// LIMIT: 20 / PAGE</span>
    </div>
    <div className="anime-meta-right" id="metaStatusCount">
      {totalFiltered > 0 ? (
        <span>
          SHOWING <strong className="hl">{startIndex + 1}&ndash;{Math.min(endIndex, totalFiltered)}</strong> OF {totalFiltered} TITLES
        </span>
      ) : (
        <span>0 TITLES FOUND</span>
      )}
    </div>
  </div>

  <section className="section">
    {allAnimeItems.length === 0 ? (
      <div className="bracket-card empty-state" id="noAnimeLogged">
        <div className="empty-state-glyph"><Tv size={36} /></div>
        <div className="empty-state-title">NO ANIME LOGGED</div>
        <p className="empty-state-desc">
          The broadcast is silent. No series currently watching, completed, or queued in the log.
        </p>
        <span className="empty-state-meta">
          // status: idle — awaiting curator entries
        </span>
      </div>
    ) : (
      <>
        {/* CATEGORY EMPTY STATE (WHEN FILTER HAS 0 TITLES, e.g. WATCHING) */}
        <div
          className="bracket-card empty-state"
          id="categoryEmptyState"
          style={allAnimeItems.length > 0 && totalFiltered === 0 ? undefined : { display: 'none' }}
        >
          <div className="empty-state-glyph"><Tv size={36} /></div>
          <div className="empty-state-title" id="categoryEmptyTitle">
            {totalFiltered === 0 && initialStatus !== 'all'
              ? `NO TITLES IN "${initialStatus.toUpperCase()}"`
              : 'NO TITLES IN CATEGORY'}
          </div>
          <p className="empty-state-desc" id="categoryEmptyDesc">
            {totalFiltered === 0 && initialStatus !== 'all'
              ? `No anime series found under status "${initialStatus}". Switch tabs to browse other entries.`
              : 'No anime series found under this status filter.'}
          </p>
          <span className="empty-state-meta">// status: category currently empty</span>
          <div style={css("margin-top: 18px;")}>
            <button
              type="button"
              className="post-btn"
              style={css("cursor: pointer; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 6px;")}
              onClick={(e) => { const w = window as any; setAnimeFilter('all') }}
            >
              // VIEW ALL TITLES ({allAnimeItems.length}) →
            </button>
          </div>
        </div>

        <div className="anime-grid" id="animeGrid" style={totalFiltered === 0 ? { display: 'none' } : undefined}>
          {allAnimeItems.map((item) => {
            const matchesFilter =
              initialStatus === 'all'
                ? true
                : initialStatus === 'paused'
                ? item.status === 'paused' || item.status === 'on_hold'
                : item.status === initialStatus;
            
            const matchedIndex = matchesFilter ? filteredAnimeItems.indexOf(item) : -1;
            const isVisibleOnPage = matchesFilter && matchedIndex >= startIndex && matchedIndex < endIndex;

            const progressPercent = item.total_episodes
              ? Math.min(100, Math.round(((item.current_episode || 0) / item.total_episodes) * 100))
              : (item.current_episode ? 50 : 0);
            return (
            <div
              className="anime-card bracket-card"
              data-status={item.status}
              data-year={item.season_year || 0}
              id={`anime-${item.id}`}
              style={isVisibleOnPage ? undefined : { display: 'none' }}
            >
              {/* COVER IMAGE */}
              <div className="anime-card-cover-wrap">
                {item.cover_url ? (
                  <img src={item.cover_url} alt={item.title} className="anime-card-cover" loading="lazy" />
                ) : (
                  <div className="anime-card-cover-placeholder">
                    <Tv size={32} />
                  </div>
                )}
                <span className={`anime-status-badge ${item.status}`}>
                  {item.status.toUpperCase()}
                </span>
                {item.score && (
                  <span className="anime-score-badge">
                    <Star size={12} fill="var(--accent)" color="var(--accent)" /> {item.score}/10
                  </span>
                )}
              </div>

              {/* CARD CONTENT */}
              <div className="anime-card-content">
                <div className="anime-card-header">
                  <h3 className="anime-card-title" title={item.title}>{item.title}</h3>
                  {item.romaji_title && item.romaji_title !== item.title && (
                    <div className="anime-card-romaji">{item.romaji_title}</div>
                  )}
                  <div className="anime-card-meta">
                    <span className="format-pill">{item.format || 'TV'}</span>
                    {item.season_year && <span>{item.season_year}</span>}
                    {item.studio && <span>{item.studio}</span>}
                  </div>
                </div>

                {/* PROGRESS BAR & COUNTER */}
                <div className="anime-progress-section">
                  <div className="anime-progress-labels">
                    <span className="progress-label">PROGRESS:</span>
                    <span className="progress-val">
                      EP <strong id={`ep-val-${item.id}`}>{item.current_episode}</strong> / {item.total_episodes || '?'}
                    </span>
                  </div>
                  <div className="anime-progress-bar">
                    <div
                      className="anime-progress-fill"
                      id={`bar-${item.id}`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>



                {/* LATEST REVIEW / EPISODIC LOG SNIPPET */}
                {item.latest_review ? (
                  <div className="anime-card-review-preview">
                    <div className="review-preview-header">
                      <span className="review-pill-type">
                        {formatReviewType(item.latest_review.review_type)}
                      </span>
                      {item.latest_review.episode !== null && (
                        <span className="review-pill-ep">EP {item.latest_review.episode}</span>
                      )}
                      {item.latest_review.rating && (
                        <span className="review-pill-rating">★ {item.latest_review.rating}/10</span>
                      )}
                      <span className="review-preview-date">{formatDate(item.latest_review.created_at)}</span>
                    </div>

                    {item.latest_review.has_spoilers ? (
                      <details className="spoiler-drawer">
                        <summary className="spoiler-summary">
                          <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                          // Contains spoilers (click to reveal)
                        </summary>
                        <div className="review-text">{renderReviewContent(item.latest_review.content)}</div>
                      </details>
                    ) : (
                      <div className="review-text">{renderReviewContent(item.latest_review.content)}</div>
                    )}

                    {item.reviews.length > 1 && (
                      <button
                        type="button"
                        className="toggle-all-reviews-btn"
                        onClick={() => { const w = window as any; w.toggleReviewsDrawer?.(item.id); }}
                      >
                        // view all {item.reviews.length} logs &darr;
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="no-reviews-note">
                    // no review logs yet
                  </div>
                )}

                {/* FULL REVIEWS DRAWER (COLLAPSIBLE) */}
                {item.reviews.length > 1 && (
                  <div className="reviews-drawer" id={`reviews-drawer-${item.id}`} style={css("display: none;")}>
                    <div className="drawer-title">// ALL EPISODE LOGS & REVIEWS:</div>
                    <div className="reviews-timeline">
                      {item.reviews.map((rev) => (
                        <div className="timeline-review-entry" key={rev.id}>
                          <div className="timeline-header">
                            <span className="timeline-badge type">{formatReviewType(rev.review_type)}</span>
                            {rev.episode !== null && (
                              <span className="timeline-badge ep">EP {rev.episode}</span>
                            )}
                            {rev.rating && (
                              <span className="timeline-badge rating">★ {rev.rating}/10</span>
                            )}
                            <span className="timeline-date">{formatDate(rev.created_at)}</span>
                          </div>
                          {rev.has_spoilers ? (
                            <details className="spoiler-drawer">
                              <summary className="spoiler-summary">
                                <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                                // Spoilers
                              </summary>
                              <div className="timeline-content">{renderReviewContent(rev.content)}</div>
                            </details>
                          ) : (
                            <div className="timeline-content">{renderReviewContent(rev.content)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

        {/* PAGINATION BAR */}
        <nav
          className="anime-pagination bracket-card"
          id="animePagination"
          style={totalPages > 1 ? undefined : { display: 'none' }}
          aria-label="Anime watchlist pagination"
        >
          <div className="pagination-info" id="paginationInfo">
            PAGE <span className="hl">{safePage}</span> OF {totalPages} • {totalFiltered} TITLES
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className={`pagination-btn ${safePage <= 1 ? 'disabled' : ''}`}
              id="paginationPrevBtn"
              disabled={safePage <= 1}
              onClick={(e) => { const w = window as any; goToAnimePage(currentAnimePage - 1) }}
            >
              <ChevronLeft size={14} /> PREV
            </button>

            <div className="pagination-pages" id="paginationPagesContainer">
              {ssrPaginationItems.map((item) =>
                item === '...' ? (
                  <span className="pagination-ellipsis">&hellip;</span>
                ) : (
                  <button
                    type="button"
                    className={`pagination-page ${Number(item) === safePage ? 'active' : ''}`}
                    aria-current={Number(item) === safePage ? 'page' : undefined}
                    onClick={() => { const w = window as any; w.goToAnimePage?.(Number(item)); }}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              className={`pagination-btn ${safePage >= totalPages ? 'disabled' : ''}`}
              id="paginationNextBtn"
              disabled={safePage >= totalPages}
              onClick={(e) => { const w = window as any; goToAnimePage(currentAnimePage + 1) }}
            >
              NEXT <ChevronRight size={14} />
            </button>
          </div>
        </nav>
      </>
    )}
  </section>

    </>
  );
}
