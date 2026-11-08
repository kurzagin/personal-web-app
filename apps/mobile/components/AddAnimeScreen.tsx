import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { ArrowLeft, Search, Plus, Check, Tv, Film } from 'lucide-react-native';
import { colors, typography, spacing } from '@krpkg/ui';
import { searchAniList, addAnimeToWatchlist, type AniListSearchResult } from '../lib/api';

interface AddAnimeScreenProps {
  endpoint: string;
  token: string;
  onAnimeAdded: () => void;
  onBack: () => void;
}

const STATUS_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'watching', label: 'Watching' },
  { key: 'completed', label: 'Completed' },
  { key: 'planning', label: 'Plan to Watch' },
  { key: 'paused', label: 'Paused' },
  { key: 'dropped', label: 'Dropped' },
];

export const AddAnimeScreen: React.FC<AddAnimeScreenProps> = ({
  endpoint,
  token,
  onAnimeAdded,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AniListSearchResult[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AniListSearchResult | null>(null);

  // Form states for selected anime
  const [status, setStatus] = useState('watching');
  const [currentEpisode, setCurrentEpisode] = useState('1');
  const [totalEpisodes, setTotalEpisodes] = useState('');
  const [score, setScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setError(null);
    try {
      const results = await searchAniList(endpoint, searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setError('No anime titles found matching your search.');
      }
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (anime: AniListSearchResult) => {
    setSelectedAnime(anime);
    setCurrentEpisode('1');
    setTotalEpisodes(anime.episodes ? String(anime.episodes) : '');
    setScore('');
    setError(null);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    const eps = totalEpisodes ? parseInt(totalEpisodes, 10) : selectedAnime?.episodes;
    if (newStatus === 'completed' && eps) {
      setCurrentEpisode(String(eps));
    }
  };

  const handleEpChange = (newEp: string) => {
    setCurrentEpisode(newEp);
    const epNum = parseInt(newEp, 10) || 0;
    const eps = totalEpisodes ? parseInt(totalEpisodes, 10) : selectedAnime?.episodes;
    if (eps && epNum >= eps) {
      setStatus('completed');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnime || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const title =
      selectedAnime.title.english ||
      selectedAnime.title.romaji ||
      selectedAnime.title.native ||
      '';
    const cover =
      selectedAnime.coverImage?.extraLarge ||
      selectedAnime.coverImage?.large ||
      selectedAnime.coverImage?.medium ||
      null;
    const studio = selectedAnime.studios?.nodes?.[0]?.name || null;
    const cleanSummary = selectedAnime.description
      ? selectedAnime.description.replace(/<[^>]*>?/gm, '')
      : null;

    const currentEpNum = parseInt(currentEpisode, 10) || 0;
    const totalEpNum = totalEpisodes ? parseInt(totalEpisodes, 10) : (selectedAnime.episodes || null);
    const scoreNum = score ? parseInt(score, 10) : null;

    const res = await addAnimeToWatchlist(endpoint, token, {
      anilist_id: selectedAnime.id,
      title,
      romaji_title: selectedAnime.title.romaji,
      native_title: selectedAnime.title.native,
      cover_url: cover,
      banner_url: selectedAnime.bannerImage,
      format: selectedAnime.format,
      status,
      current_episode: currentEpNum,
      total_episodes: totalEpNum,
      score: scoreNum,
      genres: selectedAnime.genres || [],
      studio,
      season_year: selectedAnime.seasonYear,
      summary: cleanSummary,
    });

    setIsSubmitting(false);

    if (res.success) {
      onAnimeAdded();
      onBack();
    } else {
      setError(res.error || 'Failed to catalog anime');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.accent} />
          <Text style={styles.backBtnText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>CATALOG ANIME</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Search Console */}
        <View style={styles.card}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          <View style={styles.sectionHead}>
            <Tv size={15} color={colors.accent} />
            <Text style={styles.sectionTitle}>ANILIST SYNC CONSOLE</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Search the AniList database to sync cover artwork, format, episode counts, and studio metadata.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>[ERR] {error}</Text>
            </View>
          )}

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search title (e.g. Serial Experiments Lain)..."
              placeholderTextColor={colors.textDim}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.searchBtn, (!searchQuery.trim() || isSearching) && styles.searchBtnDisabled]}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              activeOpacity={0.8}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#0a0a0c" />
              ) : (
                <Search size={16} color="#0a0a0c" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Staging Card */}
        {selectedAnime && (
          <View style={styles.stagingCard}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <View style={styles.stagingHeader}>
              <Text style={styles.stagingTitle}>// STAGED ENTRY</Text>
              <TouchableOpacity
                onPress={() => setSelectedAnime(null)}
                style={styles.changeBtn}
              >
                <Text style={styles.changeBtnText}>CHANGE</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedRow}>
              {selectedAnime.coverImage?.large ? (
                <Image
                  source={{ uri: selectedAnime.coverImage.large }}
                  style={styles.selectedCover}
                />
              ) : (
                <View style={[styles.selectedCover, styles.coverPlaceholder]}>
                  <Film size={20} color={colors.accent} />
                </View>
              )}
              <View style={styles.selectedMeta}>
                <Text style={styles.selectedName} numberOfLines={2}>
                  {selectedAnime.title.english || selectedAnime.title.romaji || selectedAnime.title.native}
                </Text>
                {selectedAnime.title.native ? (
                  <Text style={styles.selectedJp}>{selectedAnime.title.native}</Text>
                ) : null}
                <Text style={styles.selectedDetails}>
                  {selectedAnime.format || 'TV'} • {selectedAnime.seasonYear || 'N/A'} • {selectedAnime.episodes || '?'} eps
                </Text>
              </View>
            </View>

            {/* Custom Watchlist Attributes */}
            <View style={styles.formDivider} />

            <Text style={styles.inputLabel}>// STATUS</Text>
            <View style={styles.optionsRow}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optBadge,
                    status === opt.key && styles.optBadgeActive,
                  ]}
                  onPress={() => handleStatusChange(opt.key)}
                >
                  <Text
                    style={[
                      styles.optText,
                      status === opt.key && styles.optTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.grid2}>
              <View style={styles.gridItem}>
                <Text style={styles.inputLabel}>// CURRENT EPISODE</Text>
                <TextInput
                  style={styles.textInput}
                  value={currentEpisode}
                  onChangeText={handleEpChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                />
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.inputLabel}>// TOTAL EPISODES</Text>
                <TextInput
                  style={styles.textInput}
                  value={totalEpisodes}
                  onChangeText={setTotalEpisodes}
                  keyboardType="numeric"
                  placeholder="e.g. 12"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
              // SCORE (1 - 10, OPTIONAL)
            </Text>
            <TextInput
              style={styles.textInput}
              value={score}
              onChangeText={setScore}
              keyboardType="numeric"
              placeholder="e.g. 9"
              placeholderTextColor={colors.textDim}
            />

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#0a0a0c" />
              ) : (
                <View style={styles.submitBtnInner}>
                  <Check size={16} color="#0a0a0c" />
                  <Text style={styles.submitBtnText}>ADD TO WATCHLIST →</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Search Results List */}
        {!selectedAnime && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              // SEARCH RESULTS ({searchResults.length})
            </Text>
            {searchResults.map((item) => {
              const itemTitle = item.title.english || item.title.romaji || item.title.native;
              const coverImg = item.coverImage?.large || item.coverImage?.medium;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultItem}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  {coverImg ? (
                    <Image source={{ uri: coverImg }} style={styles.resultThumb} />
                  ) : (
                    <View style={[styles.resultThumb, styles.coverPlaceholder]}>
                      <Film size={16} color={colors.accent} />
                    </View>
                  )}
                  <View style={styles.resultMeta}>
                    <Text style={styles.resultItemTitle} numberOfLines={1}>
                      {itemTitle}
                    </Text>
                    {item.title.native ? (
                      <Text style={styles.resultItemJp} numberOfLines={1}>
                        {item.title.native}
                      </Text>
                    ) : null}
                    <Text style={styles.resultItemSub}>
                      {item.format || 'TV'} • {item.seasonYear || 'N/A'} • {item.episodes ? `${item.episodes} eps` : 'Ongoing'}
                    </Text>
                  </View>
                  <View style={styles.selectArrow}>
                    <Plus size={16} color={colors.accent} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#0e0e12',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(224, 169, 109, 0.1)',
  },
  backBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.accent,
    fontWeight: 'bold',
  },
  pageTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    borderRadius: 4,
    position: 'relative',
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
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 16,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: typography.fontMono,
    color: colors.danger,
    fontSize: 11,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  resultsContainer: {
    gap: 8,
  },
  resultsTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    padding: 10,
    gap: 12,
  },
  resultThumb: {
    width: 44,
    height: 60,
    borderRadius: 3,
    backgroundColor: '#1a1a20',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultMeta: {
    flex: 1,
    gap: 2,
  },
  resultItemTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.text,
    fontWeight: 'bold',
  },
  resultItemJp: {
    fontFamily: typography.fontJp,
    fontSize: 11,
    color: colors.textDim,
  },
  resultItemSub: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  selectArrow: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(224, 169, 109, 0.12)',
  },
  stagingCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 16,
    borderRadius: 4,
    position: 'relative',
    gap: 12,
  },
  stagingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stagingTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  changeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    backgroundColor: '#1f1f26',
  },
  changeBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  selectedRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  selectedCover: {
    width: 60,
    height: 84,
    borderRadius: 4,
    backgroundColor: '#1a1a20',
  },
  selectedMeta: {
    flex: 1,
    gap: 4,
  },
  selectedName: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedJp: {
    fontFamily: typography.fontJp,
    fontSize: 11,
    color: colors.textDim,
  },
  selectedDetails: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
  },
  formDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 4,
  },
  inputLabel: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a30',
    backgroundColor: '#0a0a0c',
  },
  optBadgeActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(224, 169, 109, 0.15)',
  },
  optText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  optTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.sm,
  },
  gridItem: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.fontMono,
    fontSize: 13,
    color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0a0a0c',
    letterSpacing: 1,
  },
});
