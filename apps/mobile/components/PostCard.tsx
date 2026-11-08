import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Heart, MessageSquare, ExternalLink, Image as ImageIcon } from 'lucide-react-native';
import { colors, typography, spacing } from '@krpkg/ui';
import type { PostMediaItem } from '../lib/api';

interface PostCardProps {
  id: string;
  authorName?: string;
  authorHandle?: string;
  avatarUrl?: string;
  content: string;
  category?: string;
  createdAt?: string | Date;
  likesCount?: number;
  media?: PostMediaItem[];
  animeMeta?: {
    title?: string;
    cover_url?: string;
    score?: number;
    episode?: number | null;
    review_type?: string | null;
    has_spoilers?: boolean;
  } | null;
  onPress?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  id,
  authorName = 'Kur Zagin',
  authorHandle = '@kurzagin',
  avatarUrl,
  content,
  category,
  createdAt,
  likesCount = 0,
  media = [],
  animeMeta,
  onPress,
}) => {
  const formattedDate = (() => {
    if (!createdAt) return '';
    try {
      const d = new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        return `${diffMins}m ago`;
      }
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  })();

  const cleanBody = content.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\n{3,}/g, '\n\n').trim();

  return (
    <View style={styles.cardContainer}>
      {/* 1:1 Cyberpunk Bracket Corners */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{authorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.authorHandle}>{authorHandle}</Text>
        </View>

        <View style={styles.badges}>
          {category === 'anime' && (
            <View style={[styles.pillBadge, styles.animePill]}>
              <Text style={styles.animePillText}>ANIME LOG</Text>
            </View>
          )}
          {media.length > 0 && (
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>MEDIA</Text>
            </View>
          )}
          <Text style={styles.postTime}>{formattedDate}</Text>
        </View>
      </View>

      {/* Anime Meta Card if present */}
      {category === 'anime' && animeMeta && (
        <View style={styles.animeBanner}>
          {animeMeta.cover_url && (
            <Image source={{ uri: animeMeta.cover_url }} style={styles.animeCover} />
          )}
          <View style={styles.animeDetails}>
            <View style={styles.animeTitleRow}>
              <Text style={styles.animeTitle} numberOfLines={1}>
                {animeMeta.title}
              </Text>
              {animeMeta.score !== undefined && (
                <Text style={styles.animeScore}>★ {animeMeta.score}/10</Text>
              )}
            </View>
            <View style={styles.animeTagsRow}>
              {animeMeta.episode !== null && animeMeta.episode !== undefined ? (
                <View style={styles.subPill}>
                  <Text style={styles.subPillText}>EP {animeMeta.episode}</Text>
                </View>
              ) : (
                <View style={styles.subPill}>
                  <Text style={styles.subPillText}>SERIES</Text>
                </View>
              )}
              {animeMeta.review_type && (
                <View style={styles.subPill}>
                  <Text style={styles.subPillText}>{animeMeta.review_type.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
              )}
              {animeMeta.has_spoilers && (
                <View style={[styles.subPill, styles.spoilerPill]}>
                  <Text style={styles.spoilerPillText}>⚠️ SPOILERS</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Post Text Body */}
      {cleanBody ? (
        <Text style={styles.contentBody}>{cleanBody}</Text>
      ) : null}

      {/* Media Image Grid (1:1 Web) */}
      {media.length > 0 && (
        <View style={styles.mediaGrid}>
          {media.slice(0, 4).map((m, idx) => (
            <TouchableOpacity
              key={m.id || idx}
              style={[styles.mediaItem, media.length === 1 && styles.mediaItemFull]}
              activeOpacity={0.85}
              onPress={() => m.url && Linking.openURL(m.url)}
            >
              <Image source={{ uri: m.url }} style={styles.mediaImg} resizeMode="cover" />
              <View style={styles.formatBadge}>
                <Text style={styles.formatBadgeText}>AVIF</Text>
              </View>
              {idx === 3 && media.length > 4 && (
                <View style={styles.moreMediaOverlay}>
                  <Text style={styles.moreMediaText}>+{media.length - 4} more</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Footer Actions (1:1 Web Buttons) */}
      <View style={styles.footer}>
        <View style={styles.actionBtn}>
          <Heart size={14} color={colors.accent} />
          <Text style={styles.actionNum}>{likesCount}</Text>
        </View>

        <View style={styles.actionBtn}>
          <MessageSquare size={13} color={colors.textDim} />
          <Text style={styles.actionNumMuted}>REPLY</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: colors.accent,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarWrap: {
    marginRight: spacing.sm,
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontFamily: typography.fontMono,
    fontSize: 14,
    color: colors.accent,
    fontWeight: 'bold',
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  authorHandle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBadge: {
    backgroundColor: 'rgba(224, 169, 109, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(224, 169, 109, 0.3)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  pillText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  animePill: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  animePillText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: '#eab308',
    letterSpacing: 0.5,
  },
  postTime: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    marginLeft: 2,
  },
  animeBanner: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    padding: spacing.xs + 2,
    marginVertical: spacing.xs,
    gap: spacing.sm,
  },
  animeCover: {
    width: 44,
    height: 60,
    borderRadius: 2,
  },
  animeDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  animeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  animeTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 6,
  },
  animeScore: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
  },
  animeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  subPill: {
    backgroundColor: '#18181d',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  subPillText: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.textDim,
  },
  spoilerPill: {
    borderColor: colors.danger,
  },
  spoilerPillText: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.danger,
  },
  contentBody: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  mediaItem: {
    width: '48%',
    height: 120,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  mediaItemFull: {
    width: '100%',
    height: 180,
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  formatBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  formatBadgeText: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.accent,
  },
  moreMediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMediaText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#1d1d21',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionNum: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
  },
  actionNumMuted: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
});
