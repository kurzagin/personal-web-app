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
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, typography, spacing } from '@kurzagin/ui';
import {
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
  DEFAULT_ENDPOINT,
} from './lib/storage';
import {
  verifyOperatorSession,
  fetchFeedPosts,
  fetchProfile,
  fetchTracks,
  fetchGuestbook,
  postGuestbookReply,
  type WebDbPost,
  type PostMediaItem,
  type GuestbookEntry,
  type WebProfile,
  type DbTrack,
} from './lib/api';
import { AuthGate } from './components/AuthGate';
import { PostCard } from './components/PostCard';
import { GuestbookCard } from './components/GuestbookCard';
import { DossierView } from './components/DossierView';
import { MusicView } from './components/MusicView';
import { BottomNav, type TabKey } from './components/BottomNav';
import { CreatePostModal } from './components/CreatePostModal';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [endpoint, setEndpoint] = useState<string>(DEFAULT_ENDPOINT);
  const [token, setToken] = useState<string | null>(null);
  const [operatorUser, setOperatorUser] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [feedFilter, setFeedFilter] = useState<string>('all');
  const [posts, setPosts] = useState<WebDbPost[]>([]);
  const [mediaByPost, setMediaByPost] = useState<Record<string, PostMediaItem[]>>({});
  const [profile, setProfile] = useState<WebProfile | null>(null);
  const [tracks, setTracks] = useState<DbTrack[]>([]);
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

  const loadData = async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [feedData, profileData, tracksData, guestbookData] = await Promise.all([
        fetchFeedPosts(endpoint, feedFilter),
        fetchProfile(endpoint),
        fetchTracks(endpoint),
        fetchGuestbook(endpoint),
      ]);

      setPosts(feedData.posts);
      setMediaByPost(feedData.mediaByPost);
      setProfile(profileData);
      setTracks(tracksData);
      setGuestbookEntries(guestbookData);
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
  }, [token, feedFilter]);

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
      const refreshed = await fetchGuestbook(endpoint);
      setGuestbookEntries(refreshed);
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

      {/* 1:1 Top Brand Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navBrand} onPress={() => setActiveTab('home')}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>kurzagin</Text>
          <Text style={styles.brandJp}>クルザギン</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.transmitBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.transmitText}>+ TRANSMIT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={handleDisconnect}
            activeOpacity={0.8}
          >
            <Text style={styles.exitText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tab Views */}
      <View style={styles.mainContent}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.fetchingText}>SYNCHRONIZING TERMINAL...</Text>
          </View>
        ) : activeTab === 'home' || activeTab === 'blog' ? (
          <ScrollView
            contentContainerStyle={styles.scrollList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.accent}
              />
            }
          >
            {/* 1:1 Web Hero Section (Shown on Home Tab) */}
            {activeTab === 'home' && (
              <View style={styles.heroSection}>
                {profile?.banner_url ? (
                  <View style={styles.heroBannerWrap}>
                    <Image source={{ uri: profile.banner_url }} style={styles.heroBannerImg} />
                    <View style={styles.heroGridOverlay} />
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                    <Text style={styles.heroCoordTop}>35.6614° N, 139.6681° E</Text>
                    <Text style={styles.heroCoordBottom}>v0.1.3 — last updated 10.02</Text>
                  </View>
                ) : null}

                <View style={styles.heroContent}>
                  <Text style={styles.heroLabel}>PERSONAL LOG</Text>
                  <Text style={styles.heroTitle}>
                    <Text style={{ color: colors.accent }}>kurzagin</Text>{'\n'}back alleys
                  </Text>
                  <Text style={styles.heroJpSub}>クルザギンの裏通り</Text>
                  <Text style={styles.heroDesc}>
                    A quiet corner of the web — vinyl crackle, late-night anime, half-finished games, and whatever else washes up. Somewhere between a journal and a junkyard.
                  </Text>
                </View>

                <View style={styles.divider} />
              </View>
            )}

            {/* 1:1 Blog Section Header */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>blog</Text>
              <Text style={styles.jpLabel}>日誌</Text>
              <View style={styles.line} />
              <Text style={styles.operatorTag}>// @{operatorUser}</Text>
            </View>

            {/* In-place Transmission Trigger */}
            <TouchableOpacity
              style={styles.composerBar}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Text style={styles.composerTag}>// TRANSMISSION CONSOLE</Text>
              <Text style={styles.composerPlaceholder}>
                broadcast new transmission to kurzagin... (supports #tags)
              </Text>
            </TouchableOpacity>

            {/* 1:1 Feed Category Filter Bar */}
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={[styles.filterBtn, feedFilter === 'all' && styles.filterBtnActive]}
                onPress={() => setFeedFilter('all')}
              >
                <Text style={[styles.filterBtnText, feedFilter === 'all' && styles.filterBtnTextActive]}>
                  // ALL LOGS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterBtn, feedFilter === 'media' && styles.filterBtnActive]}
                onPress={() => setFeedFilter('media')}
              >
                <Text style={[styles.filterBtnText, feedFilter === 'media' && styles.filterBtnTextActive]}>
                  // MEDIA ONLY (メディア)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterBtn, feedFilter === 'anime' && styles.filterBtnActive]}
                onPress={() => setFeedFilter('anime')}
              >
                <Text style={[styles.filterBtnText, feedFilter === 'anime' && styles.filterBtnTextActive]}>
                  // ANIME LOGS (アニメ)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Posts Feed Stream */}
            {posts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>NO TRANSMISSIONS LOGGED</Text>
                <Text style={styles.emptySubtitle}>
                  The back alleys are quiet tonight. Awaiting operator broadcast.
                </Text>
              </View>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  authorName={post.author_name}
                  authorHandle={post.author_handle}
                  avatarUrl={profile?.avatar_url}
                  content={post.content}
                  category={post.category}
                  createdAt={post.created_at}
                  likesCount={post.likes_count}
                  media={mediaByPost[post.id] || []}
                  animeMeta={post.anime_meta}
                />
              ))
            )}

            {/* Operator Dossier Preview on Home Tab */}
            {activeTab === 'home' && (
              <>
                <View style={styles.divider} />
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>operator</Text>
                  <Text style={styles.jpLabel}>人物</Text>
                  <View style={styles.line} />
                </View>
                <DossierView profile={profile} endpoint={endpoint} />
              </>
            )}
          </ScrollView>
        ) : activeTab === 'music' ? (
          <ScrollView
            contentContainerStyle={styles.scrollList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.accent}
              />
            }
          >
            <MusicView tracks={tracks} endpoint={endpoint} />
          </ScrollView>
        ) : activeTab === 'messages' ? (
          <FlatList
            data={guestbookEntries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GuestbookCard entry={item} onSendReply={handleSendGuestbookReply} />
            )}
            contentContainerStyle={styles.scrollList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.accent}
              />
            }
            ListHeaderComponent={
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>guestbook</Text>
                <Text style={styles.jpLabel}>伝言板</Text>
                <View style={styles.line} />
                <Text style={styles.operatorTag}>// {guestbookEntries.length} MESSAGES</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>NO MESSAGES</Text>
                <Text style={styles.emptySubtitle}>Guestbook entries will appear here.</Text>
              </View>
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.accent}
              />
            }
          >
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>operator dossier</Text>
              <Text style={styles.jpLabel}>人物</Text>
              <View style={styles.line} />
            </View>
            <DossierView profile={profile} endpoint={endpoint} />
          </ScrollView>
        )}
      </View>

      {/* 1:1 Cyberpunk Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Composer Modal */}
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
    backgroundColor: '#0a0a0c',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0a0a0c',
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
  topNav: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: '#0a0a0c',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  brandText: {
    fontFamily: typography.fontMono,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  brandJp: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transmitBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  transmitText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0a0a0c',
  },
  exitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exitText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  mainContent: {
    flex: 1,
  },
  scrollList: {
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
  heroSection: {
    marginBottom: spacing.md,
  },
  heroBannerWrap: {
    height: 150,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: spacing.md,
  },
  heroBannerImg: {
    width: '100%',
    height: '100%',
  },
  heroGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 12, 0.45)',
  },
  heroCoordTop: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  heroCoordBottom: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  heroContent: {
    paddingVertical: spacing.xs,
  },
  heroLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: typography.fontMono,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 28,
  },
  heroJpSub: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  heroDesc: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontMono,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  jpLabel: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#27272a',
  },
  operatorTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  composerBar: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: spacing.md,
    marginBottom: spacing.md,
    position: 'relative',
  },
  composerTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    marginBottom: 4,
    letterSpacing: 1,
  },
  composerPlaceholder: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textDim,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  filterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#0a0a0c',
  },
  filterBtnActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(224, 169, 109, 0.12)',
  },
  filterBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  filterBtnTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  emptySubtitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
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
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
});
