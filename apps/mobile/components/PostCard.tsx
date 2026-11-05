import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@kurzagin/ui';

interface PostCardProps {
  authorName?: string;
  authorHandle?: string;
  content: string;
  createdAt?: string | Date;
  likesCount?: number;
}

export const PostCard: React.FC<PostCardProps> = ({
  authorName = 'Kur Zagin',
  authorHandle = '@kurzagin',
  content,
  createdAt,
  likesCount = 0,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>{authorName}</Text>
        <Text style={styles.handle}>{authorHandle}</Text>
      </View>
      <Text style={styles.content}>{content}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>
          {createdAt ? new Date(createdAt).toLocaleDateString() : ''}
        </Text>
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
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
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
