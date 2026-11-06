import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import type { DbTrack } from './api';

interface AudioContextValue {
  tracks: DbTrack[];
  setTracks: (tracks: DbTrack[]) => void;
  currentIdx: number;
  activeTrack: DbTrack | null;
  player: AudioPlayer;
  status: AudioStatus;
  togglePlayback: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (idx: number, autoPlay?: boolean) => void;
  seekToRatio: (ratio: number) => void;
  seekRelative: (deltaSeconds: number) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Track refs to always have the latest values in async handlers and event callbacks
  const tracksRef = useRef<DbTrack[]>(tracks);
  tracksRef.current = tracks;

  const currentIdxRef = useRef<number>(currentIdx);
  currentIdxRef.current = currentIdx;

  const activeTrack = tracks[currentIdx] || null;

  // Track if audio should play when next track is loaded
  const shouldPlayRef = useRef<boolean>(false);
  // Guard against duplicate triggers when a song finishes
  const hasHandledFinishRef = useRef<boolean>(false);

  // Initialize background & silent audio mode
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  // Persistent root-level audio player (keeps running across tab/screen switches)
  const player = useAudioPlayer(activeTrack?.audio_url || null, {
    updateInterval: 500,
  });
  const status = useAudioPlayerStatus(player);

  const statusRef = useRef<AudioStatus>(status);
  statusRef.current = status;

  // Replace audio source and play when track changes
  useEffect(() => {
    if (activeTrack?.audio_url) {
      player.replace(activeTrack.audio_url);
      hasHandledFinishRef.current = false;

      if (shouldPlayRef.current) {
        player.play();
      }
    }
  }, [currentIdx]);

  const nextTrack = useCallback(() => {
    const list = tracksRef.current;
    if (list.length === 0) return;
    shouldPlayRef.current = true;
    hasHandledFinishRef.current = false;
    const nextIdx = (currentIdxRef.current + 1) % list.length;
    setCurrentIdx(nextIdx);
  }, []);

  const prevTrack = useCallback(() => {
    const list = tracksRef.current;
    if (list.length === 0) return;
    shouldPlayRef.current = true;
    hasHandledFinishRef.current = false;
    const prevIdx = (currentIdxRef.current - 1 + list.length) % list.length;
    setCurrentIdx(prevIdx);
  }, []);

  const selectTrack = useCallback((idx: number, autoPlay: boolean = true) => {
    const list = tracksRef.current;
    if (idx >= 0 && idx < list.length) {
      shouldPlayRef.current = autoPlay;
      hasHandledFinishRef.current = false;
      setCurrentIdx(idx);
    }
  }, []);

  // 1. Primary finish listener: direct playbackStatusUpdate subscription
  useEffect(() => {
    if (!player) return;

    const sub = player.addListener('playbackStatusUpdate', (s: AudioStatus) => {
      if (s.didJustFinish && !hasHandledFinishRef.current && tracksRef.current.length > 0) {
        hasHandledFinishRef.current = true;
        nextTrack();
        return;
      }

      // Check if currentTime reached duration (within 0.5s tolerance)
      if (
        !hasHandledFinishRef.current &&
        s.duration > 0 &&
        s.currentTime > 0 &&
        s.currentTime >= s.duration - 0.45 &&
        !s.playing &&
        tracksRef.current.length > 0
      ) {
        hasHandledFinishRef.current = true;
        nextTrack();
      }
    });

    return () => {
      sub.remove();
    };
  }, [player, nextTrack]);

  // 2. Secondary fallback via useAudioPlayerStatus hook
  useEffect(() => {
    if (status.didJustFinish && !hasHandledFinishRef.current && tracks.length > 0) {
      hasHandledFinishRef.current = true;
      nextTrack();
    } else if (
      !status.didJustFinish &&
      status.currentTime < (status.duration ? status.duration - 1 : 1)
    ) {
      // Reset finish flag when playing from the start of a song
      hasHandledFinishRef.current = false;
    }
  }, [status.didJustFinish, status.currentTime, status.duration, tracks.length, nextTrack]);

  const togglePlayback = () => {
    if (!activeTrack) return;
    if (status.playing) {
      shouldPlayRef.current = false;
      player.pause();
    } else {
      shouldPlayRef.current = true;
      player.play();
    }
  };

  const seekToRatio = (ratio: number) => {
    const total = status.duration || (typeof activeTrack?.duration_sec === 'number' ? activeTrack.duration_sec : 200);
    if (total > 0) {
      player.seekTo(ratio * total);
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    const total = status.duration || (typeof activeTrack?.duration_sec === 'number' ? activeTrack.duration_sec : 0);
    const target = Math.max(0, Math.min(total > 0 ? total : 999999, status.currentTime + deltaSeconds));
    player.seekTo(target);
  };

  return (
    <AudioContext.Provider
      value={{
        tracks,
        setTracks,
        currentIdx,
        activeTrack,
        player,
        status,
        togglePlayback,
        nextTrack,
        prevTrack,
        selectTrack,
        seekToRatio,
        seekRelative,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAppAudio = (): AudioContextValue => {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useAppAudio must be used within an AudioProvider');
  }
  return ctx;
};
