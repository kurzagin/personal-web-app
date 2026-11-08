import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Gamepad2, Sparkles, BookOpen, ChevronRight, Zap } from 'lucide-react-native';
import { colors, typography } from '@krpkg/ui';

export const GamesView: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle}>
          <Text style={{ color: colors.accent }}>games</Text> log
        </Text>
        <Text style={styles.headerSub}>
          <Text style={{ color: colors.accent }}>ゲーム</Text> — records &amp; ongoing progression
        </Text>
      </View>

      <View style={styles.emptyCard}>
        <Gamepad2 size={36} color={colors.accent} />
        <Text style={styles.emptyTitle}>NO GAMES CURRENTLY LOGGED</Text>
        <Text style={styles.emptyDesc}>
          This is not a backlog. Games appear here when there is a story, progress, or ongoing record worth keeping.
        </Text>
        <Text style={styles.emptyMeta}>// STATUS: IDLE — AWAITING OPERATOR LOG</Text>
      </View>
    </ScrollView>
  );
};

export const NovelsView: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'novels' | 'shorts'>('all');

  const novels = [
    {
      slug: 'everlasting-warfare',
      title: 'Everlasting Warfare',
      titleJp: '終わりなき戦火',
      tagline: 'A hundred-year conflict across Euphrates & Tigris',
      summary: 'Tactical sci-fi epic following combat units, archangels, and political machinations in an alternate postdiluvian era.',
      status: 'Active',
      chapters: 19,
      genres: ['Sci-Fi', 'Military', 'Tactical'],
    },
    {
      slug: 'heart-of-ea',
      title: 'Heart of Ea',
      titleJp: 'エアの心臓',
      tagline: 'Deep ocean depths & flood weapon revolutions',
      summary: 'Underwater biomechanics and bio-resonant striders clashing amidst ancestral covenants.',
      status: 'In Development',
      chapters: 4,
      genres: ['Cyberpunk', 'Ocean', 'Mystery'],
    },
    {
      slug: 'sakana-tachi-wa-koi-o-shiranai',
      title: 'Sakana-tachi wa Koi o Shiranai',
      titleJp: '魚たちは恋を知らない',
      tagline: 'Celestial tides, sky whales and marine research',
      summary: 'A lighthearted yet contemplative story of high school students observing celestial phenomena.',
      status: 'Drafting',
      chapters: 3,
      genres: ['Slice of Life', 'Supernatural'],
    },
  ];

  const shortStories = [
    {
      slug: 'the-eleventh-commandment',
      title: 'The Eleventh Commandment',
      titleJp: '第十一の戒律',
      tagline: 'Standalone cyberpunk tactical dispatch',
      summary: 'A covert operation into an abandoned databank deep in the neutral zone.',
      status: 'Completed',
      chapters: 5,
      genres: ['Action', 'Cyberpunk'],
    },
  ];

  const showNovels = tab === 'all' || tab === 'novels';
  const showShorts = tab === 'all' || tab === 'shorts';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle}>
          <Text style={{ color: colors.accent }}>archive</Text> &amp; stories
        </Text>
        <Text style={styles.headerSub}>
          <Text style={{ color: colors.accent }}>目録</Text> — serial manuscripts, one-shots &amp; tactical codices
        </Text>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, tab === 'all' && styles.filterBtnActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.filterBtnText, tab === 'all' && styles.filterBtnTextActive]}>
            ALL ARCHIVES ({novels.length + shortStories.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, tab === 'novels' && styles.filterBtnActive]}
          onPress={() => setTab('novels')}
        >
          <Text style={[styles.filterBtnText, tab === 'novels' && styles.filterBtnTextActive]}>
            SERIALS ({novels.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, tab === 'shorts' && styles.filterBtnActive]}
          onPress={() => setTab('shorts')}
        >
          <Text style={[styles.filterBtnText, tab === 'shorts' && styles.filterBtnTextActive]}>
            SHORTS ({shortStories.length})
          </Text>
        </TouchableOpacity>
      </View>

      {showNovels && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <BookOpen size={14} color={colors.accent} />
            <Text style={styles.sectionTitleText}>// SERIAL NOVELS [長編小説]</Text>
          </View>
          {novels.map((item) => (
            <View key={item.slug} style={styles.novelCard}>
              <View style={styles.novelCardHeader}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.chapterCount}>{item.chapters} CHAPTERS</Text>
              </View>
              <Text style={styles.novelTitle}>
                {item.title} <Text style={styles.novelTitleJp}>{item.titleJp}</Text>
              </Text>
              <Text style={styles.novelTagline}>{item.tagline}</Text>
              <Text style={styles.novelSummary}>{item.summary}</Text>
              <View style={styles.genresRow}>
                {item.genres.map((g) => (
                  <Text key={g} style={styles.genreTag}>
                    #{g}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {showShorts && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <Sparkles size={14} color={colors.accent} />
            <Text style={styles.sectionTitleText}>// SHORT STORIES [短編一話]</Text>
          </View>
          {shortStories.map((item) => (
            <View key={item.slug} style={styles.novelCard}>
              <View style={styles.novelCardHeader}>
                <View style={[styles.statusBadge, { borderColor: colors.accent }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.accent }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.chapterCount}>{item.chapters} CHAPTERS</Text>
              </View>
              <Text style={styles.novelTitle}>
                {item.title} <Text style={styles.novelTitleJp}>{item.titleJp}</Text>
              </Text>
              <Text style={styles.novelTagline}>{item.tagline}</Text>
              <Text style={styles.novelSummary}>{item.summary}</Text>
              <View style={styles.genresRow}>
                {item.genres.map((g) => (
                  <Text key={g} style={styles.genreTag}>
                    #{g}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  pageHeader: {
    marginBottom: 4,
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
  emptyCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  emptyTitle: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  emptyDesc: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyMeta: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(196, 147, 104, 0.15)',
    borderColor: colors.accent,
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
  sectionWrap: {
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
  },
  sectionTitleText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 1,
  },
  novelCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  novelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.text,
  },
  chapterCount: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  novelTitle: {
    fontFamily: typography.fontMono,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  novelTitleJp: {
    fontSize: 12,
    color: colors.textDim,
    fontWeight: 'normal',
  },
  novelTagline: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
  },
  novelSummary: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 16,
  },
  genresRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  genreTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textMuted,
  },
});
