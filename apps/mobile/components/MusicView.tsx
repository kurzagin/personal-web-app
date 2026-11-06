import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Disc3, ExternalLink } from 'lucide-react-native';
import { colors, typography, spacing } from '@kurzagin/ui';
import type { DbTrack } from '../lib/api';

interface MusicViewProps {
  tracks: DbTrack[];
  endpoint: string;
}

export const MusicView: React.FC<MusicViewProps> = ({ tracks, endpoint }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeTrack = tracks[currentIdx] || null;

  const handleNext = () => {
    if (tracks.length === 0) return;
    setCurrentIdx((prev) => (prev + 1) % tracks.length);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    setCurrentIdx((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  return (
    <View style={styles.container}>
      {/* 1:1 Section Header */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>now spinning</Text>
        <Text style={styles.jpLabel}>音楽</Text>
        <View style={styles.line} />
        <Text style={styles.tracksCount}>// {tracks.length} TRACKS</Text>
      </View>

      {/* Main Vinyl Player Card (1:1 Web Bracket Card) */}
      <View style={styles.card}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <View style={styles.turntableRow}>
          {/* Vinyl Ring and Turntable Center */}
          <TouchableOpacity
            style={styles.vinylArea}
            onPress={() => setIsPlaying(!isPlaying)}
            activeOpacity={0.8}
          >
            <View style={[styles.vinylDisc, isPlaying && styles.vinylSpinning]}>
              <View style={styles.vinylCenterLabel}>
                {activeTrack?.cover_url ? (
                  <Image source={{ uri: activeTrack.cover_url }} style={styles.vinylCoverImg} />
                ) : (
                  <Text style={styles.vinylFallback}>KRZ</Text>
                )}
                <View style={styles.spindle} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Track Info & Controls */}
          <View style={styles.playerMeta}>
            <View style={styles.statusBadge}>
              <View style={[styles.pulseDot, isPlaying && styles.pulseDotActive]} />
              <Text style={styles.statusText}>{isPlaying ? 'NOW PLAYING' : 'TURNTABLE STANDBY'}</Text>
            </View>

            <Text style={styles.trackTitle} numberOfLines={1}>
              {activeTrack?.title || 'No track loaded'}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {activeTrack?.artist ? `${activeTrack.artist}${activeTrack.album ? ` — [${activeTrack.album}]` : ''}` : 'Turntable silent'}
            </Text>

            {/* Playback Controls */}
            <View style={styles.ctrlRow}>
              <TouchableOpacity style={styles.ctrlBtn} onPress={handlePrev}>
                <SkipBack size={14} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ctrlBtn, styles.ctrlPlay]}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause size={14} color={colors.bg} />
                ) : (
                  <Play size={14} color={colors.bg} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctrlBtn} onPress={handleNext}>
                <SkipForward size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {activeTrack?.audio_url ? (
          <TouchableOpacity
            style={styles.streamLink}
            onPress={() => Linking.openURL(activeTrack.audio_url)}
          >
            <Text style={styles.streamLinkText}>DIRECT R2 AUDIO STREAM</Text>
            <ExternalLink size={10} color={colors.accent} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Crate Tracklist */}
      <View style={styles.crateList}>
        <Text style={styles.crateTitle}>// CRATE LOG ({tracks.length})</Text>
        {tracks.map((t, idx) => (
          <TouchableOpacity
            key={t.id || idx}
            style={[styles.crateItem, currentIdx === idx && styles.crateItemActive]}
            onPress={() => {
              setCurrentIdx(idx);
              setIsPlaying(true);
            }}
          >
            <Text style={[styles.crateNum, currentIdx === idx && styles.crateNumActive]}>
              {String(idx + 1).padStart(2, '0')}.
            </Text>
            <View style={styles.crateItemInfo}>
              <Text style={[styles.crateItemTitle, currentIdx === idx && styles.crateItemTitleActive]}>
                {t.title}
              </Text>
              <Text style={styles.crateItemArtist}>{t.artist}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
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
  tracksCount: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  card: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: spacing.md,
    position: 'relative',
    marginBottom: spacing.lg,
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
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  turntableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  vinylArea: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylDisc: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0a0a0c',
    borderWidth: 2,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylSpinning: {
    borderColor: colors.accent,
  },
  vinylCenterLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
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
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.bg,
  },
  spindle: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg,
    position: 'absolute',
  },
  playerMeta: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.textDim,
  },
  pulseDotActive: {
    backgroundColor: colors.accent,
  },
  statusText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 0.8,
  },
  trackTitle: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  trackArtist: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    marginBottom: spacing.xs,
  },
  ctrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ctrlBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#18181d',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlPlay: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  streamLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  streamLinkText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
  },
  crateList: {
    gap: 6,
  },
  crateTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  crateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: spacing.sm,
    borderRadius: 4,
    gap: spacing.sm,
  },
  crateItemActive: {
    borderColor: colors.accent,
    backgroundColor: '#18181d',
  },
  crateNum: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  crateNumActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  crateItemInfo: {
    flex: 1,
  },
  crateItemTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.text,
  },
  crateItemTitleActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  crateItemArtist: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
});
