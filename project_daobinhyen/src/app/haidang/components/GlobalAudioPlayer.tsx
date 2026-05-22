'use client';

import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useAudioStore } from '@/app/api/user/lighthouse/store/useAudioStore';
import { AUDIO_BASE_URL, AMBIENT_TRACKS } from '@/app/api/user/lighthouse/data/radioData';

interface GlobalAudioPlayerProps {
  floor: 1 | 2;
}

export default function GlobalAudioPlayer({ floor }: GlobalAudioPlayerProps) {
  const { currentTrack, isPlaying, volume, activeAmbientId, ambientVolume } = useAudioStore();
  
  const mainTrackRef = useRef<Howl | null>(null);
  const ambientTrackRef = useRef<Howl | null>(null);

  // --- 1. HANDLE MAIN TRACK ---
  useEffect(() => {
    let active = true;

    if (currentTrack) {
      // Stop previous track if exists
      if (mainTrackRef.current) {
        mainTrackRef.current.stop();
        mainTrackRef.current.unload();
        mainTrackRef.current = null;
      }

      // Fetch presigned URL from R2
      fetch(`/api/user/lighthouse/audio?file=${encodeURIComponent(currentTrack.url)}`)
        .then((res) => {
          if (!res.ok) throw new Error('API response not ok');
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          if (data.url) {
            const currentVolume = useAudioStore.getState().volume;
            const currentIsPlaying = useAudioStore.getState().isPlaying;
            const howl = new Howl({
              src: [data.url],
              format: ['mp3'], // Force mp3 format to bypass query params in presigned URL
              html5: true,
              loop: currentTrack.genre === 'brainwaves',
              volume: currentVolume,
            });
            mainTrackRef.current = howl;
            if (currentIsPlaying) {
              howl.play();
            }
          } else {
            throw new Error('No URL returned');
          }
        })
        .catch((err) => {
          console.warn('Failed to load track from R2, falling back to local source:', err);
          if (!active) return;

          const currentVolume = useAudioStore.getState().volume;
          const currentIsPlaying = useAudioStore.getState().isPlaying;
          const howl = new Howl({
            src: [`${AUDIO_BASE_URL}/${currentTrack.url}`],
            html5: true,
            loop: currentTrack.genre === 'brainwaves',
            volume: currentVolume,
          });
          mainTrackRef.current = howl;
          if (currentIsPlaying) {
            howl.play();
          }
        });
    } else {
      if (mainTrackRef.current) {
        mainTrackRef.current.stop();
      }
    }

    return () => {
      active = false;
    };
  }, [currentTrack]);

  // Handle Play/Pause for Main Track
  useEffect(() => {
    if (mainTrackRef.current) {
      if (isPlaying && !mainTrackRef.current.playing()) {
        mainTrackRef.current.play();
      } else if (!isPlaying && mainTrackRef.current.playing()) {
        mainTrackRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle Volume and Mute for Main Track based on Floor
  useEffect(() => {
    if (mainTrackRef.current) {
      if (floor === 1) {
        mainTrackRef.current.mute(true);
      } else {
        mainTrackRef.current.mute(false);
        mainTrackRef.current.volume(volume);
      }
    }
  }, [volume, floor]);

  // --- 2. HANDLE AMBIENT TRACK ---
  useEffect(() => {
    let active = true;

    if (activeAmbientId) {
      const ambientDef = AMBIENT_TRACKS.find(a => a.id === activeAmbientId);
      if (ambientDef) {
        // Stop previous ambient
        if (ambientTrackRef.current) {
          ambientTrackRef.current.stop();
          ambientTrackRef.current.unload();
          ambientTrackRef.current = null;
        }

        // Fetch presigned URL from R2
        fetch(`/api/user/lighthouse/audio?file=${encodeURIComponent(ambientDef.url)}`)
          .then((res) => {
            if (!res.ok) throw new Error('API response not ok');
            return res.json();
          })
          .then((data) => {
            if (!active) return;
            if (data.url) {
              const currentAmbientVolume = useAudioStore.getState().ambientVolume;
              const howl = new Howl({
                src: [data.url],
                format: ['mp3'], // Force mp3 format
                html5: true,
                loop: true,
                volume: currentAmbientVolume,
              });
              ambientTrackRef.current = howl;
              howl.play();
            } else {
              throw new Error('No URL returned');
            }
          })
          .catch((err) => {
            console.warn('Failed to load ambient from R2, falling back to local source:', err);
            if (!active) return;

            const currentAmbientVolume = useAudioStore.getState().ambientVolume;
            const howl = new Howl({
              src: [`${AUDIO_BASE_URL}/${ambientDef.url}`],
              html5: true,
              loop: true,
              volume: currentAmbientVolume,
            });
            ambientTrackRef.current = howl;
            howl.play();
          });
      }
    } else {
      if (ambientTrackRef.current) {
        ambientTrackRef.current.stop();
        ambientTrackRef.current = null;
      }
    }

    return () => {
      active = false;
    };
  }, [activeAmbientId]);

  // Handle Volume and Mute for Ambient Track based on Floor
  useEffect(() => {
    if (ambientTrackRef.current) {
      if (floor === 1) {
        ambientTrackRef.current.mute(true);
      } else {
        ambientTrackRef.current.mute(false);
        ambientTrackRef.current.volume(ambientVolume);
      }
    }
  }, [ambientVolume, floor]);

  return null; // Headless component
}
