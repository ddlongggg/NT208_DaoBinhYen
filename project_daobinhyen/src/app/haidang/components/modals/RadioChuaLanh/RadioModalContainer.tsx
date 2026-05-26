'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, ArrowLeft, Disc3 } from 'lucide-react';
import { useAudioStore } from '@/app/api/user/lighthouse/store/useAudioStore';
import { GENRES, TRACKS, AMBIENT_TRACKS, GenreId, TrackDef } from '@/app/api/user/lighthouse/data/radioData';
import { Howl } from 'howler';

interface RadioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RadioModalContainer({ isOpen, onClose }: RadioModalProps) {
  const [selectedGenre, setSelectedGenre] = useState<GenreId | null>(null);
  const [hoveredGenre, setHoveredGenre] = useState<GenreId | null>(null);

  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    activeAmbientId, 
    ambientVolume,
    playTrack, 
    togglePlayPause, 
    setVolume,
    setAmbient,
    setAmbientVolume
  } = useAudioStore();

  const playSfx = () => {
    const sfx = new Howl({ src: ['/Lighthouse/soundeffect/vinyl-slide.mp3'], volume: 0.5 });
    sfx.play();
  };

  const handlePlayTrack = (track: TrackDef) => {
    if (currentTrack?.id !== track.id) {
      playSfx();
      playTrack(track);
    } else {
      togglePlayPause();
    }
  };

  if (!isOpen) return null;

  const currentHoveredOrSelectedDef = GENRES.find(g => g.id === (hoveredGenre || selectedGenre));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl h-[80vh] bg-[#F5E6D3] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border-4 border-[#8B5A2B]/40"
      >
        {/* Nút Đóng */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
        >
          <X size={24} className="text-[#5C3A21]" />
        </button>

        {/* --- CỘT TRÁI: BẢNG ĐIỀU KHIỂN & MIXER --- */}
        <div className="w-full md:w-1/3 bg-[#E8D4BB] border-r-2 border-[#D2B48C] flex flex-col p-6 min-h-0">
          <h2 className="text-2xl font-black text-[#5C3A21] mb-6 flex items-center gap-2">
            <Disc3 size={28} className="animate-spin-slow" /> Máy Phát Nhạc
          </h2>

          {/* Now Playing */}
          <div className="bg-[#F5E6D3] rounded-xl p-4 shadow-inner border border-[#D2B48C] mb-6">
            <div className="text-sm text-[#8B5A2B] font-semibold mb-1">Đang phát:</div>
            <div className="text-lg font-bold text-[#5C3A21] truncate">
              {currentTrack ? currentTrack.title : 'Chưa có nhạc'}
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <button 
                onClick={togglePlayPause}
                disabled={!currentTrack}
                className="w-12 h-12 bg-[#5C3A21] text-white rounded-full flex items-center justify-center hover:bg-[#4A2E1A] transition-colors disabled:opacity-50"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
              </button>
              
              <div className="flex-1 flex items-center gap-2">
                <Volume2 size={16} className="text-[#8B5A2B]" />
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#5C3A21]"
                />
              </div>
            </div>
          </div>

          {/* Ambient Mixer */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-lg font-bold text-[#5C3A21] mb-4">Trộn Âm Thanh</h3>
            <div className="space-y-3 overflow-y-auto pr-2 pb-4 flex-1 min-h-0 custom-scrollbar">
              {AMBIENT_TRACKS.map(ambient => (
                <div 
                  key={ambient.id}
                  className={`p-3 rounded-xl border-2 transition-colors cursor-pointer flex flex-col gap-2 ${activeAmbientId === ambient.id ? 'bg-[#F5E6D3] border-[#8B5A2B]' : 'bg-white/40 border-transparent hover:bg-white/60'}`}
                  onClick={() => setAmbient(activeAmbientId === ambient.id ? null : ambient.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#5C3A21]">{ambient.icon} {ambient.name}</span>
                    {activeAmbientId === ambient.id && (
                      <span className="text-xs bg-[#5C3A21] text-white px-2 py-1 rounded-full">Đang bật</span>
                    )}
                  </div>
                  {activeAmbientId === ambient.id && (
                    <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                      <Volume2 size={14} className="text-[#8B5A2B]" />
                      <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={ambientVolume}
                        onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                        className="w-full accent-[#8B5A2B]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: THƯ VIỆN ĐĨA NHẠC --- */}
        <div className="w-full md:w-2/3 p-6 flex flex-col">
          <AnimatePresence mode="wait">
            {!selectedGenre ? (
              /* MÀN HÌNH CHỌN THỂ LOẠI */
              <motion.div 
                key="genres"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <h3 className="text-xl font-bold text-[#5C3A21] mb-2">Thư Viện Đĩa Nhạc</h3>
                <div className="h-16 mb-4">
                  {currentHoveredOrSelectedDef ? (
                    <p className="text-[#8B5A2B] italic text-sm md:text-base transition-opacity">
                      "{currentHoveredOrSelectedDef.description}"
                    </p>
                  ) : (
                    <p className="text-[#8B5A2B]/60 italic text-sm md:text-base">
                      Hãy chọn một đĩa nhạc để bắt đầu...
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
                  {GENRES.map(genre => (
                    <div
                      key={genre.id}
                      onClick={() => {
                        if (genre.id === 'secrets') {
                          const secretTracks = TRACKS.filter(t => t.genre === 'secrets');
                          const randomTrack = secretTracks[Math.floor(Math.random() * secretTracks.length)];
                          handlePlayTrack(randomTrack);
                        } else {
                          setSelectedGenre(genre.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredGenre(genre.id)}
                      onMouseLeave={() => setHoveredGenre(null)}
                      className="group cursor-pointer aspect-square rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent"
                      style={{ backgroundColor: `${genre.colorTheme}15` }}
                    >
                      <Disc3 size={48} color={genre.colorTheme} className="mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <h4 className="font-bold text-lg" style={{ color: genre.colorTheme }}>{genre.name}</h4>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* MÀN HÌNH DANH SÁCH BÀI NHẠC */
              <motion.div 
                key="tracks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <button 
                  onClick={() => setSelectedGenre(null)}
                  className="flex items-center gap-2 text-[#8B5A2B] hover:text-[#5C3A21] font-semibold mb-6 transition-colors w-max"
                >
                  <ArrowLeft size={20} /> Quay lại
                </button>
                
                <h3 className="text-2xl font-black text-[#5C3A21] mb-4">
                  {GENRES.find(g => g.id === selectedGenre)?.name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pb-4 pr-2">
                  {TRACKS.filter(t => t.genre === selectedGenre).map(track => {
                    const isThisPlaying = currentTrack?.id === track.id;
                    return (
                      <div 
                        key={track.id}
                        onClick={() => handlePlayTrack(track)}
                        className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${isThisPlaying ? 'bg-[#5C3A21] text-white shadow-lg' : 'bg-white/50 text-[#5C3A21] hover:bg-white border border-[#D2B48C]'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isThisPlaying ? 'bg-white/20' : 'bg-[#E8D4BB]'}`}>
                          {isThisPlaying && isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
                        </div>
                        <div className="flex-1 truncate font-semibold">
                          {track.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(92, 58, 33, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #8B5A2B;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #5C3A21;
          }
        `}} />
      </motion.div>
    </div>
  );
}
