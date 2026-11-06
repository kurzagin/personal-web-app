import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Tv,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Film,
} from 'lucide-react-native';
import { colors, typography } from '@kurzagin/ui';
import { fetchAnimeList, type AnimeWatchlistItem } from '../lib/api';

interface AnimeViewProps {
  endpoint: string;
}

const PAGE_SIZE = 20;

export const AnimeView: React.FC<AnimeViewProps> = ({ endpoint }) => {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [allItems, setAllItems] = useState<AnimeWatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnime = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch all items once so client-side status filtering & stats calculate 100% 1:1 like web
      const data = await fetchAnimeList(endpoint, 'all');
      setAllItems(data);
    } catch (err) {
      console.warn('Failed to load anime from API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnime();
  }, [endpoint]);

  // Reset pagination to page 1 on filter change
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  // Compute 1:1 stats bar like Web AnimeView
  const stats = useMemo(() => {
    let total = allItems.length;
    let watching = 0;
    let completed = 0;
    let planning = 0;
    let paused = 0;
    let dropped = 0;
    let totalEpisodes = 0;

    for (const item of allItems) {
      const st = item.status;
      if (st === 'watching') watching++;
      else if (st === 'completed') completed++;
      else if (st === 'planning') planning++;
      else if (st === 'paused') paused++;
      else if (st === 'dropped') dropped++;

      totalEpisodes += item.current_episode || 0;
    }

    return { total, watching, completed, planning, paused, dropped, totalEpisodes };
  }, [allItems]);

  // Filtered array
  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems;
    if (filter === 'paused') {
      return allItems.filter((i) => i.status === 'paused' || (i as any).status === 'on_hold');
    }
    return allItems.filter((i) => i.status === filter);
  }, [allItems, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredItems.length);
  const paginatedItems = useMemo(() => {
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, startIndex, endIndex]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1:1 Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle}>
          <Text style={{ color: colors.accent }}>anime</Text> log
        </Text>
        <Text style={styles.headerSub}>
          <Text style={{ color: colors.accent }}>アニメ</Text> — watching, rewatching, remembering • synced via AniList
        </Text>
      </View>

      {/* 1:1 Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>TOTAL LOGGED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.statItem, styles.statHighlight]}>
          <Text style={[styles.statNum, { color: colors.accent }]}>{stats.watching}</Text>
          <Text style={styles.statLabel}>WATCHING</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.completed}</Text>
          <Text style={styles.statLabel}>COMPLETED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.planning}</Text>
          <Text style={styles.statLabel}>PLANNING</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.totalEpisodes}</Text>
          <Text style={styles.statLabel}>EPS WATCHED</Text>
        </View>
      </View>

      {/* 1:1 Filter Tabs Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
            // ALL ({stats.total})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'watching' && styles.filterBtnActive]}
          onPress={() => handleFilterChange('watching')}
        >
          <Text style={[styles.filterBtnText, filter === 'watching' && styles.filterBtnTextActive]}>
            WATCHING ({stats.watching})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'completed' && styles.filterBtnActive]}
          onPress={() => handleFilterChange('completed')}
        >
          <Text style={[styles.filterBtnText, filter === 'completed' && styles.filterBtnTextActive]}>
            COMPLETED ({stats.completed})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'planning' && styles.filterBtnActive]}
          onPress={() => handleFilterChange('planning')}
        >
          <Text style={[styles.filterBtnText, filter === 'planning' && styles.filterBtnTextActive]}>
            PLAN TO WATCH ({stats.planning})
          </Text>
        </TouchableOpacity>

        {stats.paused > 0 && (
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'paused' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('paused')}
          >
            <Text style={[styles.filterBtnText, filter === 'paused' && styles.filterBtnTextActive]}>
              PAUSED ({stats.paused})
            </Text>
          </TouchableOpacity>
        )}

        {stats.dropped > 0 && (
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'dropped' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('dropped')}
          >
            <Text style={[styles.filterBtnText, filter === 'dropped' && styles.filterBtnTextActive]}>
              DROPPED ({stats.dropped})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 1:1 Meta Info Bar */}
      <View style={styles.metaBar}>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>// SORT: YEAR (NEWEST → OLDEST)</Text>
        </View>
        <Text style={styles.metaCount}>
          SHOWING{' '}
          <Text style={{ color: colors.accent, fontWeight: 'bold' }}>
            {filteredItems.length > 0 ? `${startIndex + 1}–${endIndex}` : 0}
          </Text>{' '}
          OF {filteredItems.length} TITLES
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (totalPages <= 1) return <View style={{ height: 40 }} />;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
          disabled={page <= 1}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft size={14} color={page <= 1 ? colors.textDim : colors.text} />
          <Text style={[styles.pageBtnText, page <= 1 && { color: colors.textDim }]}>
            PREV
          </Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          PAGE <Text style={{ color: colors.accent }}>{page}</Text> / {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
          disabled={page >= totalPages}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          <Text style={[styles.pageBtnText, page >= totalPages && { color: colors.textDim }]}>
            NEXT
          </Text>
          <ChevronRight size={14} color={page >= totalPages ? colors.textDim : colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: AnimeWatchlistItem }) => {
    const progressPercent = item.total_episodes
      ? Math.min(100, Math.round(((item.current_episode || 0) / item.total_episodes) * 100))
      : item.current_episode ? 50 : 0;

    return (
      <View style={styles.animeCard}>
        {/* Cover Wrap */}
        <View style={styles.coverWrap}>
          {item.cover_url ? (
            <Image
              source={{ uri: item.cover_url }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackCover}>
              <Film size={28} color={colors.textDim} />
            </View>
          )}

          {/* Status Badge top-left */}
          <View style={[styles.statusBadge, styles[`statusBadge_${item.status}` as keyof typeof styles] || styles.statusBadge_planning]}>
            <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
          </View>

          {/* Score Badge top-right */}
          {item.score ? (
            <View style={styles.scoreBadge}>
              <Star size={10} color={colors.accent} fill={colors.accent} />
              <Text style={styles.scoreText}>{item.score}/10</Text>
            </View>
          ) : null}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.title_jp ? (
              <Text style={styles.cardRomaji} numberOfLines={1}>
                {item.title_jp}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <View style={styles.formatPill}>
                <Text style={styles.formatPillText}>{item.format || 'TV'}</Text>
              </View>
              {item.season_year ? (
                <Text style={styles.metaYearText}>{item.season_year}</Text>
              ) : null}
            </View>
          </View>

          {/* Progress Section matching Web */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>PROGRESS:</Text>
              <Text style={styles.progressVal}>
                EP <Text style={{ color: colors.accent, fontWeight: 'bold' }}>{item.current_episode || 0}</Text> / {item.total_episodes || '?'}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          {/* Latest Review Snippet */}
          {item.latest_review ? (
            <View style={styles.reviewSnippet}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewPillType}>
                  {(item.latest_review.review_type || 'review').replace(/_/g, ' ').toUpperCase()}
                </Text>
                {item.latest_review.episode !== null && item.latest_review.episode !== undefined && (
                  <Text style={styles.reviewPillEp}>EP {item.latest_review.episode}</Text>
                )}
                {item.latest_review.score ? (
                  <Text style={styles.reviewPillRating}>★ {item.latest_review.score}/10</Text>
                ) : null}
              </View>
              <Text style={styles.reviewText} numberOfLines={3}>
                {item.latest_review.content.replace(/!\[(.*?)\]\((.*?)\)/g, '[Image]')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading && !refreshing && allItems.length === 0) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.loadingText}>SYNCHRONIZING ANIME LOG...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={paginatedItems}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listWrap}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadAnime(true)}
          tintColor={colors.accent}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Tv size={36} color={colors.textDim} />
          <Text style={styles.emptyTitle}>NO TITLES IN "{filter.toUpperCase()}"</Text>
          <Text style={styles.emptyDesc}>
            No anime series found under status "{filter}". Switch filter tabs to browse other entries.
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listWrap: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    gap: 12,
    marginBottom: 16,
  },
  pageHeader: {
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: typography.fontMono,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  headerSub: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
    lineHeight: 16,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statHighlight: {},
  statNum: {
    fontFamily: typography.fontMono,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#27272a',
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(196, 147, 104, 0.15)',
    borderColor: colors.accent,
  },
  filterBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  filterBtnTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  metaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  metaPillText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
  },
  metaCount: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  animeCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  coverWrap: {
    width: '100%',
    height: 180,
    backgroundColor: '#0d0f12',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  fallbackCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  statusBadge_watching: {
    backgroundColor: 'rgba(0, 255, 170, 0.9)',
  },
  statusBadge_completed: {
    backgroundColor: 'rgba(80, 160, 255, 0.9)',
  },
  statusBadge_planning: {
    backgroundColor: 'rgba(255, 200, 50, 0.9)',
  },
  statusBadge_paused: {
    backgroundColor: 'rgba(180, 180, 180, 0.9)',
  },
  statusBadge_dropped: {
    backgroundColor: 'rgba(255, 80, 80, 0.9)',
  },
  statusBadgeText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 0.5,
  },
  scoreBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 10, 12, 0.85)',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
  },
  scoreText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accent,
  },
  cardContent: {
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    gap: 3,
  },
  cardTitle: {
    fontFamily: typography.fontMono,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardRomaji: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  formatPill: {
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
  },
  formatPillText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
  },
  metaYearText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  progressSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    padding: 8,
    gap: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  progressVal: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.text,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  reviewSnippet: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    padding: 10,
    gap: 6,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  reviewPillType: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    fontWeight: 'bold',
  },
  reviewPillEp: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 3,
  },
  reviewPillRating: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: '#ffd700',
  },
  reviewText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 30,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
  },
  pageBtnDisabled: {
    opacity: 0.35,
  },
  pageBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
  },
  pageInfo: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textDim,
    letterSpacing: 1,
  },
  emptyDesc: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 16,
  },
});
