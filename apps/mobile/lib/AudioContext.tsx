import React, { createContext, useContext, useState, useEffect } from 'react';
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
  selectTrack: (idx: number) => void;
  seekToRatio: (ratio: number) => void;
  seekRelative: (deltaSeconds: number) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  const activeTrack = tracks[currentIdx] || null;

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

  // Replace audio source when user selects another track
  useEffect(() => {
    if (activeTrack?.audio_url) {
      player.replace(activeTrack.audio_url);
    }
  }, [currentIdx]);

  // Auto-next when song ends
  useEffect(() => {
    if (status.didJustFinish && tracks.length > 0) {
      nextTrack();
    }
  }, [status.didJustFinish]);

  const togglePlayback = () => {
    if (!activeTrack) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    const nextIdx = (currentIdx + 1) % tracks.length;
    setCurrentIdx(nextIdx);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    setCurrentIdx(prevIdx);
  };

  const selectTrack = (idx: number) => {
    if (idx >= 0 && idx < tracks.length) {
      setCurrentIdx(idx);
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
