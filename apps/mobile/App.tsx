import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, typography, spacing } from '@kurzagin/ui';
import type { PostItem } from '@kurzagin/shared';
import {
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
  DEFAULT_ENDPOINT,
} from './lib/storage';
import {
  verifyOperatorSession,
  fetchFeedPosts,
  fetchGuestbook,
  postGuestbookReply,
  type GuestbookEntry,
} from './lib/api';
import { AuthGate } from './components/AuthGate';
import { PostCard } from './components/PostCard';
import { GuestbookCard } from './components/GuestbookCard';
import { CreatePostModal } from './components/CreatePostModal';

type ActiveTab = 'feed' | 'guestbook' | 'dossier';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [endpoint, setEndpoint] = useState<string>(DEFAULT_ENDPOINT);
  const [token, setToken] = useState<string | null>(null);
  const [operatorUser, setOperatorUser] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [feedFilter, setFeedFilter] = useState<string>('all');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Initialize session from device storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadStoredSession();
        setEndpoint(stored.endpoint);
        if (stored.token) {
          const verified = await verifyOperatorSession(stored.endpoint, stored.token);
          if (verified.valid) {
            setToken(stored.token);
            setOperatorUser(verified.username || stored.username || 'operator');
          } else {
            await clearStoredSession();
          }
        }
      } catch (err) {
        console.warn('Init session error:', err);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // Fetch data on tab change or auth change
  const loadData = async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeTab === 'feed') {
        const filterArg = feedFilter === 'all' ? undefined : feedFilter;
        const fetched = await fetchFeedPosts(endpoint, filterArg);
        setPosts(fetched);
      } else if (activeTab === 'guestbook') {
        const fetched = await fetchGuestbook(endpoint);
        setGuestbookEntries(fetched);
      }
    } catch (err) {
      console.warn('Data load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, activeTab, feedFilter]);

  const handleAuthenticated = async (
    newToken: string,
    newEndpoint: string,
    username: string
  ) => {
    setToken(newToken);
    setEndpoint(newEndpoint);
    setOperatorUser(username);
    await saveStoredSession(newEndpoint, newToken, username);
  };

  const handleDisconnect = async () => {
    setToken(null);
    setOperatorUser(null);
    setPosts([]);
    setGuestbookEntries([]);
    await clearStoredSession();
  };

  const handleSendGuestbookReply = async (entryId: string, replyText: string) => {
    if (!token) return false;
    const res = await postGuestbookReply(endpoint, token, entryId, replyText);
    if (res.success) {
      // Refresh guestbook list
      loadData();
      return true;
    }
    return false;
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>// INITIALIZING TERMINAL...</Text>
      </SafeAreaView>
    );
  }

  // Auth Gate: Pure URL + zero secrets embedded
  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <AuthGate
          initialEndpoint={endpoint}
          onAuthenticated={handleAuthenticated}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Cyberpunk Status Header */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>kurzagin</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>
              OPERATOR: {operatorUser?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.transmitBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.transmitBtnText}>+ TRANSMIT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={handleDisconnect}
            activeOpacity={0.8}
          >
            <Text style={styles.disconnectBtnText}>EXIT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs (1:1 Web Architecture) */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'feed' && styles.navTabActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === 'feed' && styles.navTabTextActive,
            ]}
          >
            // FEED
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navTab,
            activeTab === 'guestbook' && styles.navTabActive,
          ]}
          onPress={() => setActiveTab('guestbook')}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === 'guestbook' && styles.navTabTextActive,
            ]}
          >
            // MESSAGES
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navTab,
            activeTab === 'dossier' && styles.navTabActive,
          ]}
          onPress={() => setActiveTab('dossier')}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === 'dossier' && styles.navTabTextActive,
            ]}
          >
            // DOSSIER
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-filter Bar (For Feed) */}
      {activeTab === 'feed' && (
        <View style={styles.filterBar}>
          {(['all', 'media', 'anime'] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                feedFilter === cat && styles.filterChipActive,
              ]}
              onPress={() => setFeedFilter(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  feedFilter === cat && styles.filterChipTextActive,
                ]}
              >
                #{cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.mainContainer}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.fetchingText}>PULLING TELEMETRY...</Text>
          </View>
        ) : activeTab === 'feed' ? (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PostCard
                authorName={item.author_name}
                authorHandle={item.author_handle}
                content={item.content}
                category={item.category}
                createdAt={item.created_at}
                likesCount={item.likes_count}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>NO TRANSMISSIONS LOGGED</Text>
                <Text style={styles.emptySubtitle}>
                  Feed is currently clear or matches no active filter.
                </Text>
              </View>
            }
          />
        ) : activeTab === 'guestbook' ? (
          <FlatList
            data={guestbookEntries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GuestbookCard
                entry={item}
                onSendReply={handleSendGuestbookReply}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>INBOX EMPTY</Text>
                <Text style={styles.emptySubtitle}>
                  No visitor dispatches found in the guestbook.
                </Text>
              </View>
            }
          />
        ) : (
          <View style={styles.dossierContainer}>
            <View style={styles.dossierCard}>
              <Text style={styles.dossierTitle}>NODE ARCHITECTURE</Text>
              <Text style={styles.dossierRow}>
                ENDPOINT: <Text style={styles.highlight}>{endpoint}</Text>
              </Text>
              <Text style={styles.dossierRow}>
                DATABASE: <Text style={styles.highlight}>Cloudflare D1 SQL</Text>
              </Text>
              <Text style={styles.dossierRow}>
                STORAGE: <Text style={styles.highlight}>Cloudflare R2</Text>
              </Text>
              <Text style={styles.dossierRow}>
                CLIENT ACCESS: <Text style={styles.highlight}>Zero Creds Bundled</Text>
              </Text>
              <Text style={styles.dossierRow}>
                STATUS: <Text style={styles.highlight}>Secured &amp; Synced</Text>
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Modal for Transmitting New Post */}
      <CreatePostModal
        visible={showCreateModal}
        endpoint={endpoint}
        token={token}
        onPostCreated={() => loadData()}
        onClose={() => setShowCreateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 1.2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  brandGroup: {
    gap: 2,
  },
  brandTitle: {
    fontFamily: typography.fontMono,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  statusText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  transmitBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 4,
  },
  transmitBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.bg,
    letterSpacing: 1,
  },
  disconnectBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 4,
  },
  disconnectBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  navBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  navTab: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabActive: {
    borderBottomColor: colors.accent,
    backgroundColor: colors.bgCardHover,
  },
  navTabText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 0.8,
  },
  navTabTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  filterChipTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  mainContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fetchingText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  emptySubtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textDim,
  },
  dossierContainer: {
    padding: spacing.lg,
  },
  dossierCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dossierTitle: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  dossierRow: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 20,
  },
  highlight: {
    color: colors.text,
    fontWeight: 'bold',
  },
});
