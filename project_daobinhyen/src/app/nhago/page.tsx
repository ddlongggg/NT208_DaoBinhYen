"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Khai báo kiểu dữ liệu cho trạng thái thời gian
type TimeSession = 'night' | 'sunrise' | 'midday' | 'afternoon';

const WoodHousePage: React.FC = () => {
  const router = useRouter(); // Khởi tạo router
  const [session, setSession] = useState<TimeSession>('midday');
  const [isSleeping, setIsSleeping] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [musicType, setMusicType] = useState<'lofi' | 'fm' | null>(null);

  //Phat nhac demo
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const toggleMusic = (type: 'lofi' | 'fm') => {
    if (!audioRef.current) return;
  
    const audio = audioRef.current;
    let source = '';
  
    if (type === 'lofi') {
      // Loa: Phát file mp3 bạn để trong folder music
      source = '/audio/demo.mp3'; 
    } else {
      // Đài: Gọi stream từ trạm phát radio bên thứ 3
      source = 'https://lofi.stream.laut.fm/lofi'; 
    }
  
    // Nếu người dùng đổi từ Loa sang Đài hoặc ngược lại
    if (audio.src !== source) {
      audio.src = source;
      audio.load();
    }
  
    // Xử lý bật/tắt
    if (isPlaying && musicType === type) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      setMusicType(type);
    }
  };

  const toggleSleep = () => {
    const nextSleepingState = !isSleeping;
    setIsSleeping(nextSleepingState);
  
    if (audioRef.current) {
      const audio = audioRef.current;
      const targetVolume = nextSleepingState ? 0.4 : 1.0; // Điểm đến: 0.1 khi ngủ, 1.0 khi tỉnh
      const step = 0.05; // Mỗi bước thay đổi bao nhiêu (càng nhỏ càng mượt)
      const intervalTime = 50; // Thay đổi sau mỗi 50ms (tổng cộng khoảng 0.5s - 1s để xong)
  
      const fadeEffect = setInterval(() => {
        if (nextSleepingState) {
          // Đang giảm âm lượng (Fade Out)
          if (audio.volume > targetVolume) {
            audio.volume = Math.max(0, audio.volume - step);
          } else {
            clearInterval(fadeEffect);
          }
        } else {
          // Đang tăng âm lượng (Fade In)
          if (audio.volume < targetVolume) {
            audio.volume = Math.min(1, audio.volume + step);
          } else {
            clearInterval(fadeEffect);
          }
        }
      }, intervalTime);
    }
  };
  // Logic kiểm tra giờ để đổi ảnh nền
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) setSession('night');
      else if (hour >= 5 && hour < 7) setSession('sunrise');
      else if (hour >= 7 && hour < 15) setSession('midday');
      else if (hour >= 15 && hour < 18) setSession('afternoon');
      else setSession('night');
    };

    checkTime(); // Chạy ngay khi mount
    const timer = setInterval(checkTime, 60000); // Kiểm tra lại mỗi phút
    return () => clearInterval(timer);
  }, []);

  // Map session với link ảnh tương ứng
  const bgImages: Record<TimeSession, string> = {
    night: '/wooden-house/midnight.png',
    sunrise: '/wooden-house/sunrise.png',
    midday: '/wooden-house/midday.png',
    afternoon: '/wooden-house/afternoon.png',
  };

  return (
    <div 
      className="relative w-screen h-screen bg-cover bg-center transition-all duration-[2000ms] ease-in-out flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: `url(${bgImages[session]})` }}
    >
      {/* Thẻ audio ẩn */}
      <audio 
        ref={audioRef} 
        src="/audio/demo.mp3" // Thay đúng tên file mp3 của bạn vào đây
        loop 
      />

      
      {/* --- NÚT GO BACK --- */}
      <button 
        onClick={() => router.push('/homepage')} // Hoặc router.push('/homepage') nếu muốn chỉ định đích
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full border border-white/20 transition-all group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        <span className="font-medium text-sm">Rời khỏi nhà gỗ</span>
      </button>
      {/* Overlay làm tối khi nhấn vào võng */}
      <div 
        className={`fixed inset-0 bg-[#000514]/85 z-10 pointer-events-none transition-opacity duration-[3000ms] ${
          isSleeping ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* --- CÁC VẬT DỤNG TƯƠNG TÁC --- */}
      
      {/* Loa Lo-fi */}
      <button 
        onClick={() => toggleMusic('lofi')} 
        className="absolute bottom-[20%] left-[12%] z-20 group"
      >
        {/* Sửa logic kiểm tra ở đây: phải là đang phát VÀ phải là loại lofi */}
        <div className={`p-4 rounded-xl border transition-all backdrop-blur-md ${
          isPlaying && musicType === 'lofi' ? 'bg-green-500/20 border-green-400' : 'bg-white/10 border-white/20'
        }`}>
          <p className="font-bold">
            {isPlaying && musicType === 'lofi' ? '⏸ Music Playing' : '🔊 Lo-fi Speaker'}
          </p>
          <span className="text-xs opacity-70">
            Click to {isPlaying && musicType === 'lofi' ? 'Pause' : 'Play'}
          </span>
        </div>
      </button>

      {/* Đài FM */}
      <button 
        onClick={() => setActivePanel(activePanel === 'fm' ? null : 'fm')}
        className="absolute bottom-[30%] left-[28%] z-20 group"
      >
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white group-hover:bg-white/20 transition-all">
          <p className="font-bold">📻 Live FM</p>
          <span className="text-xs opacity-70">Real-time radio</span>
        </div>
      </button>

      {/* Võng (Sleep Mode) */}
      <button 
        onClick={toggleSleep}
        className="absolute bottom-[15%] right-[20%] z-20 group"
      >
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-white group-hover:scale-110 transition-all">
          <p className="font-bold">🧶 The Hammock</p>
          <span className="text-xs opacity-70">{isSleeping ? 'Wake up' : 'Take a nap'}</span>
        </div>
      </button>

      {activePanel && (
        <div className="absolute top-24 right-10 z-30 bg-black/70 backdrop-blur-xl p-6 rounded-3xl text-white w-72 border border-white/20 animate-fade-in shadow-2xl">
          {activePanel === 'lofi' ? (
            <>
              <h3 className="text-xl font-bold mb-1">🔊 My Speaker</h3>
              <p className="text-xs opacity-60 mb-4 uppercase tracking-widest">Local Playlist</p>
              <p className="text-sm mb-4 text-gray-300">Đang phát nhạc thư giãn từ bộ sưu tập của đảo.</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-1">📻 Vintage Radio</h3>
              <p className="text-xs opacity-60 mb-4 uppercase tracking-widest">Live Broadcast</p>
              <p className="text-sm mb-4 text-gray-300">Đang bắt sóng các đài phát thanh trực tuyến...</p>
            </>
          )}
          
          <button 
            onClick={() => toggleMusic(activePanel as 'lofi' | 'fm')}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              isPlaying && musicType === activePanel 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                : 'bg-white/10 hover:bg-white/20 border border-white/10'
            }`}
          >
            {isPlaying && musicType === activePanel ? (
              <><span className="animate-pulse">●</span> Stop</>
            ) : (
              <><span className="text-lg">▶</span> Start</>
            )}
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-5 bg-black/20 text-white/80 px-4 py-1 rounded-full text-sm backdrop-blur-sm">
        {session.toUpperCase()} MODE ACTIVE
      </div>
    </div>
  );
};
export default WoodHousePage;