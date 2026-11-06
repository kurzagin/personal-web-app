import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react-native';
import { colors, typography } from '@kurzagin/ui';
import { signGuestbook, type GuestbookEntry } from '../lib/api';
import { GuestbookCard } from './GuestbookCard';

interface GuestbookViewProps {
  endpoint: string;
  entries: GuestbookEntry[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onEntryAdded: () => void;
  onSendReply?: (id: string, reply: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

export const GuestbookView: React.FC<GuestbookViewProps> = ({
  endpoint,
  entries,
  loading,
  refreshing,
  onRefresh,
  onEntryAdded,
  onSendReply,
  isAuthenticated,
}) => {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Message content cannot be empty.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await signGuestbook(
        endpoint,
        content.trim(),
        authorName.trim() || 'guest'
      );
      if (res.success) {
        setContent('');
        setAuthorName('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onEntryAdded();
      } else {
        setError(res.error || 'Failed to sign guestbook');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle}>
          <Text style={{ color: colors.accent }}>guest</Text>book
        </Text>
        <Text style={styles.headerSub}>
          <Text style={{ color: colors.accent }}>伝言板</Text> — leave a trace in the back alleys
        </Text>
      </View>

      {/* Guestbook Sign Form */}
      <View style={styles.signCard}>
        <View style={styles.signCardHead}>
          <MessageSquare size={14} color={colors.accent} />
          <Text style={styles.signTitle}>SIGN THE LOG // 署名</Text>
        </View>

        {success && (
          <View style={styles.successBox}>
            <CheckCircle2 size={14} color="#22c55e" />
            <Text style={styles.successText}>Entry dispatched to the guestbook!</Text>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.inputLabel}>YOUR CODENAME / HANDLE</Text>
        <TextInput
          style={styles.textInput}
          value={authorName}
          onChangeText={setAuthorName}
          placeholder="guest / anonymous"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>TRANSMISSION MESSAGE</Text>
        <TextInput
          style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
          value={content}
          onChangeText={setContent}
          placeholder="Leave a thought, coordinate, or dispatch..."
          placeholderTextColor={colors.textDim}
          multiline
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#0a0a0c" />
          ) : (
            <View style={styles.btnRow}>
              <Send size={13} color="#0a0a0c" />
              <Text style={styles.submitBtnText}>TRANSMIT ENTRY</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sectionDivider}>
        <Text style={styles.entriesTag}>// {entries.length} TRANSMISSIONS RECORDED</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <GuestbookCard
          entry={item}
          onSendReply={onSendReply || (async () => false)}
        />
      )}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
      ListEmptyComponent={
        !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>NO TRANSMISSIONS YET</Text>
            <Text style={styles.emptyDesc}>Be the first to leave a message in the log.</Text>
          </View>
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  headerWrap: {
    gap: 16,
    marginBottom: 4,
  },
  pageHeader: {
    marginBottom: 2,
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
  },
  signCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  signCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
    paddingBottom: 6,
  },
  signTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 1,
  },
  inputLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    padding: 10,
    color: colors.text,
    fontFamily: typography.fontMono,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0a0a0c',
    letterSpacing: 1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 6,
    padding: 8,
  },
  successText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: '#22c55e',
  },
  errorText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: '#ef4444',
  },
  sectionDivider: {
    marginTop: 6,
    marginBottom: 4,
  },
  entriesTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.8,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textDim,
    letterSpacing: 1,
  },
  emptyDesc: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
});
