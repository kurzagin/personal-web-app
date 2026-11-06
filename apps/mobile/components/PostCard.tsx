import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@kurzagin/ui';

interface PostCardProps {
  authorName?: string;
  authorHandle?: string;
  content: string;
  category?: string;
  createdAt?: string | Date;
  likesCount?: number;
}

export const PostCard: React.FC<PostCardProps> = ({
  authorName = 'Kur Zagin',
  authorHandle = '@kurzagin',
  content,
  category,
  createdAt,
  likesCount = 0,
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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Text style={styles.author}>{authorName}</Text>
          <Text style={styles.handle}>{authorHandle}</Text>
        </View>
        {category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>#{category}</Text>
          </View>
        )}
      </View>

      <Text style={styles.content}>{content}</Text>

      <View style={styles.footer}>
        <Text style={styles.meta}>{formattedDate}</Text>
        <Text style={styles.likes}>★ {likesCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  author: {
    color: colors.text,
    fontFamily: typography.fontSans,
    fontWeight: 'bold',
    fontSize: 14,
  },
  handle: {
    color: colors.textMuted,
    fontFamily: typography.fontMono,
    fontSize: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(224, 169, 109, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(224, 169, 109, 0.3)',
  },
  categoryText: {
    fontFamily: typography.fontMono,
    color: colors.accent,
    fontSize: 10,
  },
  content: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xs,
  },
  meta: {
    color: colors.textDim,
    fontSize: 11,
    fontFamily: typography.fontMono,
  },
  likes: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: typography.fontMono,
  },
});
