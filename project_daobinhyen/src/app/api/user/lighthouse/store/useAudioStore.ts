import { create } from 'zustand';
import { GenreId, TrackDef } from '../data/radioData';

interface AudioState {
  // Main Track
  currentTrack: TrackDef | null;
  isPlaying: boolean;
  volume: number;
  currentGenre: GenreId | null; // Keep track of current genre for lighting

  // Ambient Mixer - Only 1 ambient sound allowed as per user request
  activeAmbientId: string | null;
  ambientVolume: number;

  // Actions
  playTrack: (track: TrackDef) => void;
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  
  setAmbient: (ambientId: string | null) => void;
  setAmbientVolume: (vol: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.5,
  currentGenre: null,

  activeAmbientId: null,
  ambientVolume: 0.3,

  playTrack: (track) => set({ currentTrack: track, currentGenre: track.genre, isPlaying: true }),
  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (vol) => set({ volume: vol }),

  setAmbient: (ambientId) => set({ activeAmbientId: ambientId }),
  setAmbientVolume: (vol) => set({ ambientVolume: vol }),
}));
