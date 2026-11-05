import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '@kurzagin/ui';

interface CreatePostModalProps {
  apiEndpoint: string;
  adminToken: string;
  onPostCreated: () => void;
  onCancel: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  apiEndpoint,
  adminToken,
  onPostCreated,
  onCancel,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'text' | 'media' | 'anime'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiEndpoint}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Failed to submit post (${res.status})`);
      }

      setContent('');
      onPostCreated();
    } catch (err: any) {
      setError(err?.message || 'Error publishing post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEW TRANSMISSION</Text>
      
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.categoryRow}>
        {(['text', 'media', 'anime'] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                category === cat && styles.categoryTextActive,
              ]}
            >
              {cat.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.textArea}
        value={content}
        onChangeText={setContent}
        placeholder="Write transmission log or reflection..."
        placeholderTextColor={colors.textDim}
        multiline
        numberOfLines={4}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={styles.publishText}>PUBLISH</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.lg,
    margin: spacing.lg,
  },
  title: {
    fontFamily: typography.fontMono,
    color: colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBtnActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  categoryText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textMuted,
  },
  categoryTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    color: colors.text,
    fontFamily: typography.fontSans,
    fontSize: 14,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textDim,
    fontFamily: typography.fontMono,
    fontSize: 12,
  },
  publishBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 4,
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  publishText: {
    color: colors.bg,
    fontFamily: typography.fontMono,
    fontWeight: 'bold',
    fontSize: 12,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontMono,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});
