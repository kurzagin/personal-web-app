import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  useFonts,
  IBMPlexMono_300Light,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  IBMPlexSans_300Light,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSansJP_300Light,
  NotoSansJP_400Regular,
  NotoSansJP_500Medium,
  NotoSansJP_700Bold,
} from '@expo-google-fonts/noto-sans-jp';
import { colors, typography, spacing } from '@kurzagin/ui';
import {
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
  DEFAULT_ENDPOINT,
} from './lib/storage';
import { Plus } from 'lucide-react-native';
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
import { PostCard } from './components/PostCard';
import { DossierView } from './components/DossierView';
import { MusicView } from './components/MusicView';
import { BottomNav, type TabKey } from './components/BottomNav';
import { CreatePostModal } from './components/CreatePostModal';
import { CreatePostScreen } from './components/CreatePostScreen';
import { AddTrackScreen } from './components/AddTrackScreen';
import { AddAnimeScreen } from './components/AddAnimeScreen';
import { AuthGate } from './components/AuthGate';
import { ToolsView } from './components/ToolsView';
import { AnimeView } from './components/AnimeView';
import { GamesView, NovelsView } from './components/ContentHubs';
import { GuestbookView } from './components/GuestbookView';
import { SettingsView } from './components/SettingsView';
import { AudioProvider, useAppAudio } from './lib/AudioContext';

function MainApp() {
  const insets = useSafeAreaInsets();
  const { setTracks: setGlobalTracks } = useAppAudio();
  const [fontsLoaded] = useFonts({
    IBMPlexMono_300Light,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    NotoSansJP_300Light,
    NotoSansJP_400Regular,
    NotoSansJP_500Medium,
    NotoSansJP_700Bold,
  });

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
          // Optimistically restore session so app doesn't flash the login gate on offline/slow start
          setToken(stored.token);
          if (stored.username) {
            setOperatorUser(stored.username);
          }

          // Verify with server in the background / on startup
          const verified = await verifyOperatorSession(stored.endpoint, stored.token);
          if (verified.valid) {
            setOperatorUser(verified.username || stored.username || 'operator');
          } else if (!verified.networkError) {
            // Token is explicitly invalidated or expired by the server
            setToken(null);
            setOperatorUser(null);
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
      setGlobalTracks(tracksData);
      setGuestbookEntries(guestbookData);
    } catch (err) {
      console.warn('Error synchronizing data with web API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initializing) {
      loadData();
    }
  }, [initializing, endpoint, feedFilter]);

  const handleSendGuestbookReply = async (id: string, replyContent: string): Promise<boolean> => {
    if (!token) return false;
    const res = await postGuestbookReply(endpoint, token, id, replyContent);
    if (res.success) {
      await loadData();
      return true;
    }
    return false;
  };

  const handleOperatorLoginSuccess = async (newToken: string, newUsername: string) => {
    setToken(newToken);
    setOperatorUser(newUsername);
    await saveStoredSession(endpoint, newToken, newUsername);
  };

  const handleOperatorLogout = async () => {
    setToken(null);
    setOperatorUser(null);
    await clearStoredSession();
  };

  const handleUpdateEndpoint = async (newEndpoint: string) => {
    setEndpoint(newEndpoint);
    await saveStoredSession(newEndpoint, token, operatorUser);
  };

  // Top inset to guarantee Android camera cutout & status bar safety
  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0
  );

  if (initializing || !fontsLoaded) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: safeTopPadding }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>INITIALIZING KURZAGIN OS...</Text>
      </View>
    );
  }

  // Operator Security Gate: full app gate when not authenticated
  if (!token) {
    return (
      <View style={[styles.rootContainer, { paddingTop: safeTopPadding }]}>
        <StatusBar style="light" />
        <AuthGate
          initialEndpoint={endpoint}
          onAuthenticated={async (newToken, cleanEndpoint, username) => {
            setEndpoint(cleanEndpoint);
            await handleOperatorLoginSuccess(newToken, username);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.rootContainer, { paddingTop: safeTopPadding }]}>
      <StatusBar style="light" />

      {/* Top Navigation Header (100% 1:1 with Web nav.top-nav) */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.navBrand}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <View style={styles.brandDot} />
          <Text style={styles.brandTitle}>kurzagin</Text>
          <Text style={styles.brandJp}>クルザギン</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Screen Routing */}
      <View style={styles.mainContent}>
        {activeTab === 'home' || activeTab === 'blog' ? (
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
              <Text style={styles.operatorTag}>// @{operatorUser || 'kurzagin'}</Text>
            </View>

            {/* Transmission Trigger for Operator */}
            {token && (
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
            )}

            {/* Feed Filter Bar */}
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
                  The back alleys are quiet tonight.
                </Text>
              </View>
            ) : (
              posts.map((post) => {
                const postMediaList = (post.media && post.media.length > 0)
                  ? post.media
                  : (mediaByPost[post.id] || []);

                return (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    authorName={post.author_name}
                    authorHandle={post.author_handle}
                    avatarUrl={post.author_avatar || profile?.avatar_url}
                    content={post.content}
                    category={post.category}
                    createdAt={post.created_at}
                    likesCount={post.likes_count}
                    media={postMediaList}
                    animeMeta={post.anime_meta}
                  />
                );
              })
            )}

            {/* Operator Dossier on Home Tab */}
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
        ) : activeTab === 'tools' ? (
          <ToolsView />
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
        ) : activeTab === 'anime' ? (
          <AnimeView endpoint={endpoint} />
        ) : activeTab === 'games' ? (
          <GamesView />
        ) : activeTab === 'novels' ? (
          <NovelsView />
        ) : activeTab === 'guestbook' || activeTab === 'messages' ? (
          <GuestbookView
            endpoint={endpoint}
            entries={guestbookEntries}
            loading={loading}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            onEntryAdded={() => loadData()}
            onSendReply={token ? handleSendGuestbookReply : undefined}
            isAuthenticated={!!token}
          />
        ) : activeTab === 'profile' ? (
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
        ) : activeTab === 'settings' ? (
          <SettingsView
            endpoint={endpoint}
            onUpdateEndpoint={handleUpdateEndpoint}
            token={token}
            operatorUser={operatorUser}
            onLoginSuccess={handleOperatorLoginSuccess}
            onLogout={handleOperatorLogout}
          />
        ) : activeTab === 'new-post' ? (
          <CreatePostScreen
            endpoint={endpoint}
            token={token || ''}
            onPostCreated={() => {
              loadData();
              setActiveTab('home');
            }}
            onBack={() => setActiveTab('home')}
          />
        ) : activeTab === 'new-track' ? (
          <AddTrackScreen
            endpoint={endpoint}
            token={token || ''}
            onTrackAdded={() => {
              loadData();
              setActiveTab('music');
            }}
            onBack={() => setActiveTab('music')}
          />
        ) : activeTab === 'new-anime' ? (
          <AddAnimeScreen
            endpoint={endpoint}
            token={token || ''}
            onAnimeAdded={() => {
              loadData();
              setActiveTab('anime');
            }}
            onBack={() => setActiveTab('anime')}
          />
        ) : null}
      </View>

      {/* 1:1 Cyberpunk Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tracks={tracks}
        isAuthenticated={!!token}
        bottomInset={insets.bottom}
      />

      {/* Floating Action Button (+) for Post (Home/Blog), Music, and Anime */}
      {token &&
        !['new-post', 'new-track', 'new-anime'].includes(activeTab) &&
        (activeTab === 'home' ||
          activeTab === 'blog' ||
          activeTab === 'music' ||
          activeTab === 'anime') && (
          <TouchableOpacity
            style={[
              styles.fabButton,
              { bottom: Math.max(insets.bottom, 6) + 68 },
            ]}
            onPress={() => {
              if (activeTab === 'home' || activeTab === 'blog') {
                setActiveTab('new-post');
              } else if (activeTab === 'music') {
                setActiveTab('new-track');
              } else if (activeTab === 'anime') {
                setActiveTab('new-anime');
              }
            }}
            activeOpacity={0.85}
          >
            <Plus size={26} color="#0a0a0c" strokeWidth={2.8} />
          </TouchableOpacity>
        )}

      {/* Composer Modal for Operator */}
      {token ? (
        <CreatePostModal
          visible={showCreateModal}
          endpoint={endpoint}
          token={token}
          onPostCreated={() => loadData()}
          onClose={() => setShowCreateModal(false)}
        />
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AudioProvider>
        <MainApp />
      </AudioProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
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
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(10, 10, 12, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a30',
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  brandTitle: {
    fontFamily: typography.fontMono,
    color: '#e2ded6',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
  },
  brandJp: {
    fontFamily: typography.fontJp,
    color: '#706c66',
    fontSize: 11,
    marginLeft: 2,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  scrollList: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  heroBannerWrap: {
    height: 140,
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#121215',
    marginBottom: spacing.md,
  },
  heroBannerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 10, 12, 0.35)',
  },
  heroCoordTop: {
    position: 'absolute',
    top: 6,
    left: 8,
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  heroCoordBottom: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  heroContent: {
    gap: 4,
  },
  heroLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: typography.fontMono,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 26,
  },
  heroJpSub: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 1,
  },
  heroDesc: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e1e24',
    marginVertical: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontFamily: typography.fontJp,
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
  fabButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 999,
  },
});
