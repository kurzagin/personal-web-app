import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  MessageSquare,
  BookOpen,
  Send,
  CornerDownRight,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  Inbox,
  AlertCircle,
} from 'lucide-react-native';
import { colors, typography, spacing } from '@kurzagin/ui';
import {
  fetchMessages,
  replyToComment,
  postGuestbookReply,
  type CommentWithPost,
  type GuestbookEntry,
  type MessagesInboxData,
} from '../lib/api';

interface MessagesViewProps {
  endpoint: string;
  token?: string | null;
  operatorUser?: string | null;
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

export const MessagesView: React.FC<MessagesViewProps> = ({
  endpoint,
  token,
  operatorUser,
}) => {
  const [activeTab, setActiveTab] = useState<'replies' | 'guestbook'>('replies');
  const [filterType, setFilterType] = useState<'pending' | 'all'>('pending');

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inboxData, setInboxData] = useState<MessagesInboxData>({
    operatorUser: operatorUser || 'kurzagin',
    pendingReplies: [],
    allReplies: [],
    guestbook: [],
    pendingGuestbook: [],
  });

  // Reply state
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  const loadInbox = async (isRefresh: boolean = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const res = await fetchMessages(endpoint, token);
    if (res.success && res.data) {
      setInboxData(res.data);
    } else {
      setError(res.error || 'Failed to fetch operator inbox');
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (token) {
      loadInbox();
    }
  }, [endpoint, token]);

  const handleSendCommentReply = async (comment: CommentWithPost) => {
    if (!replyText.trim() || !token) return;
    setSubmittingReply(true);
    setReplyError(null);
    setReplySuccess(null);

    const res = await replyToComment(
      endpoint,
      token,
      comment.post_id,
      comment.id,
      replyText.trim(),
      operatorUser || inboxData.operatorUser || 'kurzagin'
    );

    if (res.success) {
      setReplySuccess('Reply dispatched successfully!');
      setReplyText('');
      // Optimistically update
      setInboxData((prev) => ({
        ...prev,
        allReplies: prev.allReplies.map((c) =>
          c.id === comment.id ? { ...c, is_replied: true } : c
        ),
        pendingReplies: prev.pendingReplies.filter((c) => c.id !== comment.id),
      }));

      setTimeout(() => {
        setReplyTargetId(null);
        setReplySuccess(null);
      }, 1200);
    } else {
      setReplyError(res.error || 'Failed to post reply');
    }
    setSubmittingReply(false);
  };

  const handleSendGuestbookReply = async (entry: GuestbookEntry) => {
    if (!replyText.trim() || !token) return;
    setSubmittingReply(true);
    setReplyError(null);
    setReplySuccess(null);

    const res = await postGuestbookReply(endpoint, token, entry.id, replyText.trim());

    if (res.success) {
      setReplySuccess('Guestbook reply recorded!');
      setReplyText('');
      setInboxData((prev) => ({
        ...prev,
        guestbook: prev.guestbook.map((g) =>
          g.id === entry.id
            ? { ...g, reply_content: replyText.trim(), reply_at: new Date().toISOString() }
            : g
        ),
        pendingGuestbook: prev.pendingGuestbook.filter((g) => g.id !== entry.id),
      }));

      setTimeout(() => {
        setReplyTargetId(null);
        setReplySuccess(null);
      }, 1200);
    } else {
      setReplyError(res.error || 'Failed to submit guestbook reply');
    }
    setSubmittingReply(false);
  };

  if (!token) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={28} color={colors.accent} />
        <Text style={styles.authLockTitle}>OPERATOR AUTHENTICATION REQUIRED</Text>
        <Text style={styles.authLockSub}>
          The messages inbox is restricted to the operator console. Authenticate via Settings to manage comments and feedback.
        </Text>
      </View>
    );
  }

  const displayedReplies =
    filterType === 'pending' ? inboxData.pendingReplies : inboxData.allReplies;
  const displayedGuestbook =
    filterType === 'pending' ? inboxData.pendingGuestbook : inboxData.guestbook;

  const countPendingReplies = inboxData.pendingReplies.length;
  const countPendingGuestbook = inboxData.pendingGuestbook.length;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadInbox(true)}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header Info */}
      <View style={styles.inboxHead}>
        <View style={styles.headLeft}>
          <Text style={styles.headTitle}>operator inbox</Text>
          <Text style={styles.headJp}>受信箱</Text>
        </View>
        <Text style={styles.operatorTag}>@{operatorUser || inboxData.operatorUser || 'operator'}</Text>
      </View>

      {/* Segmented Channel Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'replies' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('replies');
            setReplyTargetId(null);
          }}
        >
          <MessageSquare size={13} color={activeTab === 'replies' ? colors.accent : colors.textDim} />
          <Text style={[styles.tabBtnText, activeTab === 'replies' && styles.tabBtnTextActive]}>
            COMMENTS
          </Text>
          {countPendingReplies > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{countPendingReplies}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'guestbook' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('guestbook');
            setReplyTargetId(null);
          }}
        >
          <BookOpen size={13} color={activeTab === 'guestbook' ? colors.accent : colors.textDim} />
          <Text style={[styles.tabBtnText, activeTab === 'guestbook' && styles.tabBtnTextActive]}>
            GUESTBOOK
          </Text>
          {countPendingGuestbook > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{countPendingGuestbook}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Chips (Pending vs All) */}
      <View style={styles.filterRow}>
        <View style={styles.filterLabelWrap}>
          <Filter size={11} color={colors.textDim} />
          <Text style={styles.filterLabel}>FILTER:</Text>
        </View>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'pending' && styles.filterChipActive]}
          onPress={() => setFilterType('pending')}
        >
          <Clock size={10} color={filterType === 'pending' ? colors.accent : colors.textDim} />
          <Text style={[styles.filterChipText, filterType === 'pending' && styles.filterChipTextActive]}>
            NEEDS REPLY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <CheckCircle2 size={10} color={filterType === 'all' ? colors.accent : colors.textDim} />
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
            ALL INBOX
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {loading && !refreshing && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>Fetching transmissions...</Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>// ERROR: {error}</Text>
        </View>
      )}

      {/* TAB 1: POST COMMENTS */}
      {activeTab === 'replies' && (
        <View style={styles.listWrap}>
          {displayedReplies.length === 0 && !loading ? (
            <View style={styles.emptyCard}>
              <Inbox size={24} color={colors.textDim} />
              <Text style={styles.emptyTitle}>NO MESSAGES</Text>
              <Text style={styles.emptySub}>
                {filterType === 'pending'
                  ? 'All visitor comments have been answered by you.'
                  : 'No visitor comments received yet.'}
              </Text>
            </View>
          ) : (
            displayedReplies.map((comment) => {
              const isReplying = replyTargetId === comment.id;

              return (
                <View key={comment.id} style={styles.msgCard}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {/* Header */}
                  <View style={styles.msgCardHead}>
                    <View style={styles.authorBadgeRow}>
                      <View style={styles.dot} />
                      <Text style={styles.authorName}>{comment.author_name}</Text>
                      <Text style={styles.channelTag}>COMMENT</Text>
                    </View>
                    <Text style={styles.timeTag}>{formatTimestamp(comment.created_at)}</Text>
                  </View>

                  {/* Post Context snippet */}
                  {comment.post_content && (
                    <View style={styles.contextBox}>
                      <Text style={styles.contextLabel}>POST CONTEXT:</Text>
                      <Text style={styles.contextText} numberOfLines={2}>
                        {comment.post_content}
                      </Text>
                    </View>
                  )}

                  {/* Comment Body */}
                  <Text style={styles.msgBody}>{comment.content}</Text>

                  {/* Status Banner */}
                  <View style={styles.statusRow}>
                    {comment.is_replied ? (
                      <View style={styles.repliedTag}>
                        <Check size={11} color={colors.success} />
                        <Text style={styles.repliedTagText}>ANSWERED</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingTag}>
                        <Clock size={11} color={colors.accent} />
                        <Text style={styles.pendingTagText}>AWAITING OPERATOR</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => {
                        setReplyTargetId(isReplying ? null : comment.id);
                        setReplyText('');
                        setReplyError(null);
                        setReplySuccess(null);
                      }}
                    >
                      <CornerDownRight size={11} color={colors.accent} />
                      <Text style={styles.replyBtnText}>
                        {isReplying ? 'CANCEL' : 'REPLY'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Inline Reply Form */}
                  {isReplying && (
                    <View style={styles.replyForm}>
                      <Text style={styles.replyFormLabel}>
                        // REPLY AS @{operatorUser || 'kurzagin'}
                      </Text>
                      <TextInput
                        style={styles.replyInput}
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="Write transmission response..."
                        placeholderTextColor={colors.textDim}
                        multiline
                        numberOfLines={3}
                      />
                      {replyError && (
                        <Text style={styles.formErrorText}>// {replyError}</Text>
                      )}
                      {replySuccess && (
                        <Text style={styles.formSuccessText}>// {replySuccess}</Text>
                      )}
                      <View style={styles.replyActionRow}>
                        <TouchableOpacity
                          style={styles.sendBtn}
                          onPress={() => handleSendCommentReply(comment)}
                          disabled={submittingReply}
                        >
                          {submittingReply ? (
                            <ActivityIndicator size="small" color="#0a0a0c" />
                          ) : (
                            <>
                              <Send size={11} color="#0a0a0c" />
                              <Text style={styles.sendBtnText}>DISPATCH REPLY</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* TAB 2: GUESTBOOK ENTRIES */}
      {activeTab === 'guestbook' && (
        <View style={styles.listWrap}>
          {displayedGuestbook.length === 0 && !loading ? (
            <View style={styles.emptyCard}>
              <Inbox size={24} color={colors.textDim} />
              <Text style={styles.emptyTitle}>NO ENTRIES</Text>
              <Text style={styles.emptySub}>
                {filterType === 'pending'
                  ? 'All guestbook transmissions have been acknowledged.'
                  : 'No guestbook sign-ins recorded yet.'}
              </Text>
            </View>
          ) : (
            displayedGuestbook.map((entry) => {
              const isReplying = replyTargetId === entry.id;

              return (
                <View key={entry.id} style={styles.msgCard}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {/* Header */}
                  <View style={styles.msgCardHead}>
                    <View style={styles.authorBadgeRow}>
                      <View style={styles.dot} />
                      <Text style={styles.authorName}>{entry.author_name}</Text>
                      <Text style={styles.channelTag}>GUESTBOOK</Text>
                    </View>
                    <Text style={styles.timeTag}>{formatTimestamp(entry.created_at)}</Text>
                  </View>

                  {/* Message Body */}
                  <Text style={styles.msgBody}>{entry.content}</Text>

                  {/* Existing Reply if any */}
                  {entry.reply_content && (
                    <View style={styles.existingReplyBox}>
                      <View style={styles.existingReplyHead}>
                        <Text style={styles.existingReplyAuthor}>
                          // OPERATOR REPLY
                        </Text>
                        {entry.reply_at && (
                          <Text style={styles.existingReplyTime}>
                            {formatTimestamp(entry.reply_at)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.existingReplyBody}>{entry.reply_content}</Text>
                    </View>
                  )}

                  {/* Status Banner */}
                  <View style={styles.statusRow}>
                    {entry.reply_content ? (
                      <View style={styles.repliedTag}>
                        <Check size={11} color={colors.success} />
                        <Text style={styles.repliedTagText}>ANSWERED</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingTag}>
                        <Clock size={11} color={colors.accent} />
                        <Text style={styles.pendingTagText}>PENDING</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => {
                        setReplyTargetId(isReplying ? null : entry.id);
                        setReplyText(entry.reply_content || '');
                        setReplyError(null);
                        setReplySuccess(null);
                      }}
                    >
                      <CornerDownRight size={11} color={colors.accent} />
                      <Text style={styles.replyBtnText}>
                        {isReplying ? 'CANCEL' : entry.reply_content ? 'EDIT' : 'REPLY'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Inline Reply Form */}
                  {isReplying && (
                    <View style={styles.replyForm}>
                      <Text style={styles.replyFormLabel}>
                        // GUESTBOOK DISPATCH AS @{operatorUser || 'kurzagin'}
                      </Text>
                      <TextInput
                        style={styles.replyInput}
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="Write guestbook response..."
                        placeholderTextColor={colors.textDim}
                        multiline
                        numberOfLines={3}
                      />
                      {replyError && (
                        <Text style={styles.formErrorText}>// {replyError}</Text>
                      )}
                      {replySuccess && (
                        <Text style={styles.formSuccessText}>// {replySuccess}</Text>
                      )}
                      <View style={styles.replyActionRow}>
                        <TouchableOpacity
                          style={styles.sendBtn}
                          onPress={() => handleSendGuestbookReply(entry)}
                          disabled={submittingReply}
                        >
                          {submittingReply ? (
                            <ActivityIndicator size="small" color="#0a0a0c" />
                          ) : (
                            <>
                              <Send size={11} color="#0a0a0c" />
                              <Text style={styles.sendBtnText}>SAVE TO GUESTBOOK</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  authLockTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
    textAlign: 'center',
  },
  authLockSub: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  inboxHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 8,
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  headTitle: {
    fontFamily: typography.fontSans,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headJp: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
  },
  operatorTag: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingVertical: 9,
    borderRadius: 3,
  },
  tabBtnActive: {
    borderColor: colors.accent,
    backgroundColor: '#181512',
  },
  tabBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  tabBtnTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  badgeCount: {
    backgroundColor: colors.accent,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeCountText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0a0a0c',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  filterLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  filterLabel: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(224, 169, 109, 0.08)',
  },
  filterChipText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
  },
  filterChipTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  errorBox: {
    backgroundColor: '#1e1012',
    borderWidth: 1,
    borderColor: colors.danger || '#ef4444',
    padding: 8,
    marginBottom: spacing.md,
    borderRadius: 3,
  },
  errorText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.danger || '#ef4444',
  },
  listWrap: {
    gap: spacing.md,
  },
  emptyCard: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 3,
  },
  emptyTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  emptySub: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
  },
  msgCard: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: spacing.md,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 6,
    height: 6,
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
  msgCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#202024',
    paddingBottom: 6,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
  },
  authorName: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  channelTag: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.textDim,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  timeTag: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
  },
  contextBox: {
    backgroundColor: '#0a0a0c',
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    padding: 6,
    marginBottom: 8,
  },
  contextLabel: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.accent,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  contextText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textDim,
    fontStyle: 'italic',
  },
  msgBody: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  existingReplyBox: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 8,
    marginBottom: 10,
    borderRadius: 3,
  },
  existingReplyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  existingReplyAuthor: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  existingReplyTime: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.textDim,
  },
  existingReplyBody: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.text,
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#202024',
    paddingTop: 8,
  },
  repliedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repliedTagText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.success,
  },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingTagText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  replyBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    fontWeight: 'bold',
  },
  replyForm: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 8,
  },
  replyFormLabel: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  replyInput: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 3,
    color: colors.text,
    fontFamily: typography.fontSans,
    fontSize: 12,
    padding: 8,
    height: 70,
    textAlignVertical: 'top',
  },
  formErrorText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.danger || '#ef4444',
    marginTop: 4,
  },
  formSuccessText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.success || '#22c55e',
    marginTop: 4,
  },
  replyActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
  },
  sendBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0a0a0c',
  },
});
