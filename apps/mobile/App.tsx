import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, typography, spacing } from '@kurzagin/ui';
import type { PostItem } from '@kurzagin/shared';
import { PostCard } from './components/PostCard';
import { AdminLogin } from './components/AdminLogin';
import { CreatePostModal } from './components/CreatePostModal';

export default function App() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://kurzagin.com');
  const [showLogin, setShowLogin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}/api/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.warn('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [apiEndpoint]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>kurzagin</Text>
          <Text style={styles.headerSubtitle}>
            {adminToken ? '// OPERATOR CONNECTED' : '// VISITOR MODE'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {adminToken ? (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.actionBtnText}>+ TRANSMIT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setAdminToken(null)}
              >
                <Text style={styles.secondaryBtnText}>DISCONNECT</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowLogin(!showLogin)}
            >
              <Text style={styles.actionBtnText}>
                {showLogin ? 'CANCEL' : 'OPERATOR LOGIN'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Login Screen / Modal */}
      {showLogin && !adminToken && (
        <AdminLogin
          onLoginSuccess={(token, endpoint) => {
            setAdminToken(token);
            setApiEndpoint(endpoint);
            setShowLogin(false);
            fetchPosts();
          }}
        />
      )}

      {/* Create Post Modal */}
      {showCreateModal && adminToken && (
        <CreatePostModal
          apiEndpoint={apiEndpoint}
          adminToken={adminToken}
          onPostCreated={() => {
            setShowCreateModal(false);
            fetchPosts();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Feed */}
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.accent} />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PostCard
                authorName={item.author_name}
                authorHandle={item.author_handle}
                content={item.content}
                createdAt={item.created_at}
                likesCount={item.likes_count}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>// NO TRANSMISSIONS FOUND</Text>
              </View>
            }
            onRefresh={fetchPosts}
            refreshing={loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: typography.fontMono,
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  actionBtnText: {
    fontFamily: typography.fontMono,
    color: colors.bg,
    fontWeight: 'bold',
    fontSize: 11,
  },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  secondaryBtnText: {
    fontFamily: typography.fontMono,
    color: colors.textDim,
    fontSize: 11,
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  emptyText: {
    fontFamily: typography.fontMono,
    color: colors.textDim,
    fontSize: 12,
  },
});
