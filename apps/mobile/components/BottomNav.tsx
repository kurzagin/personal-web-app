import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import {
  Home,
  Wrench,
  Disc3,
  Tv,
  MoreHorizontal,
  X,
  ChevronRight,
  User,
  Gamepad2,
  Inbox,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import { colors, typography } from '@kurzagin/ui';
import type { DbTrack } from '../lib/api';
import { useAppAudio } from '../lib/AudioContext';

export type TabKey =
  | 'home'
  | 'tools'
  | 'music'
  | 'anime'
  | 'games'
  | 'messages'
  | 'profile'
  | 'settings'
  | 'new-post'
  | 'new-track'
  | 'new-anime';

interface BottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  tracks: DbTrack[];
  isAuthenticated: boolean;
  bottomInset?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  tracks,
  isAuthenticated,
  bottomInset = 0,
}) => {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const { activeTrack, status, togglePlayback, nextTrack, prevTrack } = useAppAudio();
  const currentTrack = activeTrack || tracks[0] || null;

  const isMoreActive = [
    'games',
    'messages',
    'profile',
    'settings',
  ].includes(activeTab);

  const handleSheetNavigate = (tab: TabKey) => {
    onSelectTab(tab);
    setSheetOpen(false);
  };

  return (
    <>
      {/* 1:1 Cyberpunk Bottom Navigation Bar */}
      <View style={[styles.navBar, { paddingBottom: Math.max(bottomInset, 6) }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onSelectTab('home')}
          activeOpacity={0.7}
        >
          <Home size={18} color={activeTab === 'home' ? colors.accent : colors.textDim} />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
            home
          </Text>
          {activeTab === 'home' && <View style={styles.indicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onSelectTab('tools')}
          activeOpacity={0.7}
        >
          <Wrench size={18} color={activeTab === 'tools' ? colors.accent : colors.textDim} />
          <Text style={[styles.navLabel, activeTab === 'tools' && styles.navLabelActive]}>
            tools
          </Text>
          {activeTab === 'tools' && <View style={styles.indicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onSelectTab('music')}
          activeOpacity={0.7}
        >
          <Disc3 size={18} color={activeTab === 'music' ? colors.accent : colors.textDim} />
          <Text style={[styles.navLabel, activeTab === 'music' && styles.navLabelActive]}>
            music
          </Text>
          {activeTab === 'music' && <View style={styles.indicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onSelectTab('anime')}
          activeOpacity={0.7}
        >
          <Tv size={18} color={activeTab === 'anime' ? colors.accent : colors.textDim} />
          <Text style={[styles.navLabel, activeTab === 'anime' && styles.navLabelActive]}>
            anime
          </Text>
          {activeTab === 'anime' && <View style={styles.indicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.7}
        >
          <MoreHorizontal
            size={18}
            color={isMoreActive ? colors.accent : colors.textDim}
          />
          <Text style={[styles.navLabel, isMoreActive && styles.navLabelActive]}>
            more
          </Text>
          {isMoreActive && <View style={styles.indicator} />}
        </TouchableOpacity>
      </View>

      {/* 1:1 Slide-Up Sheet for "More" Navigation */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setSheetOpen(false)}
        >
          <TouchableOpacity
            style={[styles.sheetContainer, { paddingBottom: Math.max(bottomInset, 16) }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <View style={styles.sheetDot} />
                <Text style={styles.sheetTitle}>navigate // more</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSheetOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Mini Turntable Bar */}
              <View style={styles.sheetSectionHead}>
                <Text style={styles.groupLabel}>audio deck // turntable</Text>
                <TouchableOpacity onPress={() => handleSheetNavigate('music')}>
                  <Text style={styles.crateLink}>crate console →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.miniPlayer}>
                <View style={styles.playerMainRow}>
                  {/* Vinyl label */}
                  <View style={styles.miniVinyl}>
                    {currentTrack?.cover_url ? (
                      <Image
                        source={{ uri: currentTrack.cover_url }}
                        style={styles.vinylCover}
                      />
                    ) : (
                      <Text style={styles.vinylFallback}>KRZ</Text>
                    )}
                    <View style={styles.spindle} />
                  </View>

                  <View style={styles.playerMeta}>
                    <View style={styles.deckStatusRow}>
                      <View style={[styles.pulseDot, status.playing && { backgroundColor: '#22c55e' }]} />
                      <Text style={styles.deckStatusText}>
                        {status.playing ? 'DECK SPINNING' : 'DECK STANDBY'}
                      </Text>
                    </View>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {currentTrack?.title || 'No tracks in crate'}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {currentTrack?.artist
                        ? `${currentTrack.artist}${
                            currentTrack.album ? ` — [${currentTrack.album}]` : ''
                          }`
                        : 'Turntable silent'}
                    </Text>
                  </View>

                  <View style={styles.miniCtrls}>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={prevTrack}>
                      <SkipBack size={13} color={colors.textDim} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ctrlBtn, styles.ctrlPlay, status.playing && { backgroundColor: colors.accent }]}
                      onPress={togglePlayback}
                    >
                      {status.playing ? (
                        <Pause size={13} color="#0a0a0c" />
                      ) : (
                        <Play size={13} color={colors.accent} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={nextTrack}>
                      <SkipForward size={13} color={colors.textDim} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Navigation Cards */}
              <View style={styles.sheetGroupHead}>
                <Text style={styles.groupLabel}>destinations</Text>
              </View>

              <TouchableOpacity
                style={[styles.sheetCard, activeTab === 'profile' && styles.sheetCardActive]}
                onPress={() => handleSheetNavigate('profile')}
              >
                <View style={styles.cardIcon}>
                  <User size={18} color={colors.accent} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>profile</Text>
                  <Text style={styles.cardDesc}>operator dossier, status &amp; links</Text>
                </View>
                <ChevronRight size={15} color={colors.textDim} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetCard, activeTab === 'games' && styles.sheetCardActive]}
                onPress={() => handleSheetNavigate('games')}
              >
                <View style={styles.cardIcon}>
                  <Gamepad2 size={18} color={colors.accent} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>games</Text>
                  <Text style={styles.cardDesc}>played &amp; backlog index</Text>
                </View>
                <ChevronRight size={15} color={colors.textDim} />
              </TouchableOpacity>

              {/* Messages Operator Inbox */}
              <TouchableOpacity
                style={[
                  styles.sheetCard,
                  activeTab === 'messages' && styles.sheetCardActive,
                  isAuthenticated && styles.operatorCard,
                ]}
                onPress={() => handleSheetNavigate('messages')}
              >
                <View style={styles.cardIcon}>
                  <Inbox size={18} color={colors.accent} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, { color: colors.accent }]}>
                    messages
                  </Text>
                  <Text style={styles.cardDesc}>operator inbox &amp; comments log</Text>
                </View>
                <ChevronRight size={15} color={colors.accent} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetCard, activeTab === 'settings' && styles.sheetCardActive]}
                onPress={() => handleSheetNavigate('settings')}
              >
                <View style={styles.cardIcon}>
                  <Settings size={18} color={colors.accent} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>settings</Text>
                  <Text style={styles.cardDesc}>preferences &amp; endpoints</Text>
                </View>
                <ChevronRight size={15} color={colors.textDim} />
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: 'rgba(10, 10, 12, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    gap: 3,
  },
  navLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  indicator: {
    position: 'absolute',
    bottom: 2,
    width: 14,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0d0d10',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#27272a',
    maxHeight: '85%',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#3f3f46',
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  sheetTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
  },
  sheetContent: {
    padding: 16,
    gap: 10,
  },
  sheetSectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetGroupHead: {
    marginTop: 8,
    marginBottom: 4,
  },
  groupLabel: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  crateLink: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  miniPlayer: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  playerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniVinyl: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  vinylCover: {
    width: '100%',
    height: '100%',
  },
  vinylFallback: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    fontWeight: 'bold',
  },
  spindle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  playerMeta: {
    flex: 1,
    gap: 2,
  },
  deckStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
  },
  deckStatusText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 0.8,
  },
  trackTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  trackArtist: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  miniCtrls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctrlBtn: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: '#2e2e38',
  },
  ctrlPlay: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(196, 147, 104, 0.12)',
  },
  sheetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  sheetCardActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(196, 147, 104, 0.08)',
  },
  operatorCard: {
    borderColor: 'rgba(196, 147, 104, 0.4)',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(196, 147, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
});
