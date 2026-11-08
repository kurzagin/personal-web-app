import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
} from 'lucide-react-native';
import { colors, typography } from '@krpkg/ui';
import type { DbTrack } from '../lib/api';
import { useAppAudio } from '../lib/AudioContext';

interface MusicViewProps {
  tracks: DbTrack[];
  endpoint: string;
}

export const MusicView: React.FC<MusicViewProps> = ({ tracks, endpoint }) => {
  const {
    currentIdx,
    activeTrack,
    status,
    togglePlayback,
    nextTrack,
    prevTrack,
    selectTrack,
    seekToRatio,
    seekRelative,
  } = useAppAudio();

  const spinValue = useRef(new Animated.Value(0)).current;

  // Continuous turntable rotation matching web `.vinyl { animation: spin 4s linear infinite; }`
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (status.playing) {
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      spinValue.stopAnimation();
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [status.playing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatSecs = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalDuration = status.duration || (typeof activeTrack?.duration_sec === 'number' ? activeTrack.duration_sec : 0);
  const progressPercent = totalDuration > 0
    ? Math.min(100, (status.currentTime / totalDuration) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* 1:1 Section Header */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>now spinning</Text>
        <Text style={styles.jpLabel}>音楽</Text>
        <View style={styles.line} />
        <Text style={styles.tracksCount}>// {tracks.length} TRACKS</Text>
      </View>

      {/* 1:1 Main Vinyl Player Wrap (Bracket Card) */}
      <View style={styles.bracketCard}>
        {/* Corner Brackets */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* 1:1 Turntable Deck Area */}
        <View style={styles.turntableArea}>
          <TouchableOpacity
            style={styles.vinylArea}
            onPress={togglePlayback}
            activeOpacity={0.9}
          >
            {/* 1:1 Outer Vinyl Ring */}
            <View style={styles.vinylRing} />

            {/* 1:1 Rotating Vinyl Disc */}
            <Animated.View
              style={[
                styles.vinylDisc,
                { transform: [{ rotate: spin }] },
                status.playing && styles.vinylDiscPlaying,
              ]}
            >
              {/* Grooves & Texture */}
              <View style={styles.grooveOuter} />
              <View style={styles.grooveInner} />

              {/* Center Vinyl Label */}
              <View style={styles.vinylCenterLabel}>
                {activeTrack?.cover_url ? (
                  <Image
                    source={{ uri: activeTrack.cover_url }}
                    style={styles.vinylCoverImg}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.vinylFallback}>KRZ</Text>
                )}
                {/* Turntable Spindle */}
                <View style={styles.vinylSpindle} />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* 1:1 Player Info & Controls */}
        <View style={styles.playerInfo}>
          <View style={styles.trackNowLabel}>
            <View style={[styles.pulse, status.playing && styles.pulseActive]} />
            <Text style={styles.trackNowText}>
              {status.isBuffering
                ? 'LOADING STREAM...'
                : status.playing
                ? 'NOW PLAYING'
                : 'TURNTABLE STANDBY'}
            </Text>
          </View>

          <Text style={styles.trackTitle} numberOfLines={1}>
            {activeTrack?.title || 'No track loaded'}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {activeTrack?.artist
              ? `${activeTrack.artist}${activeTrack.album ? ` — [${activeTrack.album}]` : ''}`
              : 'Turntable silent'}
          </Text>

          {/* 1:1 Controls with seeking */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.ctrlBtn} onPress={prevTrack}>
              <SkipBack size={14} color="#b0aca4" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() => seekRelative(-10)}
              accessibilityLabel="Rewind 10 seconds"
            >
              <RotateCcw size={14} color="#b0aca4" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctrlBtn, styles.ctrlPlay, status.playing && styles.ctrlPlayActive]}
              onPress={togglePlayback}
              disabled={status.isBuffering}
            >
              {status.isBuffering ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : status.playing ? (
                <Pause size={16} color="#0a0a0c" />
              ) : (
                <Play size={16} color={colors.accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() => seekRelative(10)}
              accessibilityLabel="Fast forward 10 seconds"
            >
              <RotateCw size={14} color="#b0aca4" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctrlBtn} onPress={nextTrack}>
              <SkipForward size={14} color="#b0aca4" />
            </TouchableOpacity>
          </View>

          {/* 1:1 Seekable Progress Track */}
          <TouchableOpacity
            style={styles.progressTrackWrap}
            activeOpacity={1}
            onPress={(e) => {
              const x = e.nativeEvent.locationX;
              const ratio = Math.max(0, Math.min(1, x / 280));
              seekToRatio(ratio);
            }}
          >
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </TouchableOpacity>

          {/* 1:1 Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{formatSecs(status.currentTime)}</Text>
            <Text style={styles.timeText}>
              {totalDuration > 0
                ? formatSecs(totalDuration)
                : typeof activeTrack?.duration === 'string'
                ? activeTrack.duration
                : '0:00'}
            </Text>
          </View>
        </View>
      </View>

      {/* 1:1 Crate Playlist Log */}
      <View style={styles.crateWrap}>
        <View style={styles.crateHeader}>
          <Text style={styles.crateHeaderTitle}>// CRATE LOG ({tracks.length})</Text>
        </View>

        {tracks.map((t, idx) => (
          <TouchableOpacity
            key={t.id || idx}
            style={[styles.crateItem, currentIdx === idx && styles.crateItemActive]}
            onPress={() => {
              selectTrack(idx);
            }}
          >
            <Text style={[styles.crateNum, currentIdx === idx && styles.crateNumActive]}>
              {String(idx + 1).padStart(2, '0')}
            </Text>
            <View style={styles.crateInfo}>
              <Text style={[styles.crateTitle, currentIdx === idx && styles.crateTitleActive]}>
                {t.title}
              </Text>
              <Text style={styles.crateArtist}>{t.artist}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: typography.fontMono,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e2ded6',
    letterSpacing: 1,
  },
  jpLabel: {
    fontFamily: typography.fontJp,
    fontSize: 11,
    color: '#706c66',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a30',
  },
  tracksCount: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: '#706c66',
  },
  bracketCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2a2a30',
    borderRadius: 4,
    padding: 20,
    position: 'relative',
    marginBottom: 24,
    gap: 16,
  },
  corner: {
    position: 'absolute',
    width: 10,
    height: 10,
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
  turntableArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  vinylArea: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#1e1e24',
  },
  vinylDisc: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2a2a30',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  vinylDiscPlaying: {
    borderColor: colors.accent,
  },
  grooveOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  grooveInner: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  vinylCenterLabel: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#18181c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  vinylCoverImg: {
    width: '100%',
    height: '100%',
  },
  vinylFallback: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 1,
  },
  vinylSpindle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#08080a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  playerInfo: {
    gap: 8,
  },
  trackNowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4a4844',
  },
  pulseActive: {
    backgroundColor: colors.accent,
  },
  trackNowText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  trackTitle: {
    fontFamily: typography.fontMono,
    fontSize: 16,
    fontWeight: '500',
    color: '#e2ded6',
  },
  trackArtist: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: '#706c66',
    fontWeight: '300',
    marginBottom: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 6,
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 2,
    backgroundColor: '#18181c',
    borderWidth: 1,
    borderColor: '#2a2a30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlPlay: {
    width: 44,
    height: 44,
    borderColor: colors.accent,
    backgroundColor: 'rgba(196, 147, 104, 0.12)',
  },
  ctrlPlayActive: {
    backgroundColor: colors.accent,
  },
  progressTrackWrap: {
    paddingVertical: 6,
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#1f1f24',
    borderRadius: 1,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: '#4a4844',
  },
  crateWrap: {
    gap: 8,
  },
  crateHeader: {
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
  },
  crateHeaderTitle: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: '#706c66',
    letterSpacing: 1,
  },
  crateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2a2a30',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 2,
    gap: 12,
  },
  crateItemActive: {
    backgroundColor: 'rgba(196, 147, 104, 0.1)',
    borderColor: colors.accent,
  },
  crateNum: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: '#4a4844',
  },
  crateNumActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  crateInfo: {
    flex: 1,
  },
  crateTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: '#b0aca4',
  },
  crateTitleActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  crateArtist: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: '#706c66',
  },
});
