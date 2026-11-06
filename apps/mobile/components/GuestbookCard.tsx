import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing } from '@kurzagin/ui';
import type { GuestbookEntry } from '../lib/api';

interface GuestbookCardProps {
  entry: GuestbookEntry;
  onSendReply: (entryId: string, replyText: string) => Promise<boolean>;
}

export const GuestbookCard: React.FC<GuestbookCardProps> = ({ entry, onSendReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const success = await onSendReply(entry.id, replyText.trim());
    setSubmitting(false);
    if (success) {
      setIsReplying(false);
      setReplyText('');
    }
  };

  const formattedDate = (() => {
    try {
      const d = new Date(entry.created_at);
      return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  })();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>{entry.author_name || 'anonymous'}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <Text style={styles.content}>{entry.content}</Text>

      {/* Operator reply display */}
      {entry.reply_content && (
        <View style={styles.replyBubble}>
          <Text style={styles.replyAuthor}>
            // {entry.reply_author || 'kurzagin'}:
          </Text>
          <Text style={styles.replyText}>{entry.reply_content}</Text>
        </View>
      )}

      {/* Reply action or quick reply input */}
      <View style={styles.footer}>
        {!isReplying ? (
          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => setIsReplying(true)}
          >
            <Text style={styles.replyBtnText}>
              {entry.reply_content ? '+ EDIT REPLY' : '+ OPERATOR REPLY'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Transmit response to visitor..."
              placeholderTextColor={colors.textDim}
              multiline
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsReplying(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleReplySubmit}
                disabled={submitting || !replyText.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <Text style={styles.sendText}>SEND</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  author: {
    color: colors.accent,
    fontFamily: typography.fontMono,
    fontWeight: 'bold',
    fontSize: 13,
  },
  date: {
    color: colors.textDim,
    fontFamily: typography.fontMono,
    fontSize: 11,
  },
  content: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
  replyBubble: {
    backgroundColor: colors.bg,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 4,
  },
  replyAuthor: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
    marginBottom: 2,
  },
  replyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xs,
  },
  replyBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  replyBtnText: {
    color: colors.textDim,
    fontFamily: typography.fontMono,
    fontSize: 11,
  },
  inputArea: {
    marginTop: spacing.xs,
  },
  replyInput: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    color: colors.text,
    fontFamily: typography.fontMono,
    fontSize: 12,
    padding: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: colors.textDim,
    fontFamily: typography.fontMono,
    fontSize: 11,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  sendText: {
    color: colors.bg,
    fontFamily: typography.fontMono,
    fontWeight: 'bold',
    fontSize: 11,
  },
});
