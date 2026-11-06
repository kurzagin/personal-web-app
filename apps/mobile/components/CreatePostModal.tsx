import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, spacing } from '@kurzagin/ui';
import { createPost } from '../lib/api';

interface CreatePostModalProps {
  visible: boolean;
  endpoint: string;
  token: string;
  onPostCreated: () => void;
  onClose: () => void;
}

const CATEGORIES = ['general', 'tech', 'builds', 'media', 'anime'];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  endpoint,
  token,
  onPostCreated,
  onClose,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);

    const res = await createPost(endpoint, token, content.trim(), []);
    setLoading(false);

    if (res.success) {
      setContent('');
      onPostCreated();
      onClose();
    } else {
      setError(res.error || 'Failed to transmit post');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <Text style={styles.title}>// TRANSMIT BROADCAST</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.errorText}>[ERR] {error}</Text>}

            <Text style={styles.label}>CLASSIFICATION / CHANNEL</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catBadge,
                    category === cat && styles.catBadgeActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catText,
                      category === cat && styles.catTextActive,
                    ]}
                  >
                    #{cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>TRANSMISSION CONTENT</Text>
            <TextInput
              style={styles.textArea}
              value={content}
              onChangeText={setContent}
              placeholder="What are you building or observing? (Markdown supported)"
              placeholderTextColor={colors.textDim}
              multiline
              autoFocus
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>DISCARD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!content.trim() || loading) && styles.btnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!content.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <Text style={styles.submitBtnText}>PUBLISH TO FEED</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontMono,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    color: colors.textDim,
    fontSize: 16,
    fontFamily: typography.fontMono,
  },
  errorText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  catBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  catBadgeActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  catText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  catTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.text,
    fontFamily: typography.fontSans,
    fontSize: 14,
    padding: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: colors.textDim,
    fontFamily: typography.fontMono,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 4,
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: colors.bg,
    fontFamily: typography.fontMono,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
