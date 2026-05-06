"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/app/lib/firebase'; 

type TimeSession = 'night' | 'sunrise' | 'midday' | 'afternoon';

const WoodHousePage: React.FC = () => {
  const router = useRouter();
  const [session, setSession] = useState<TimeSession>('midday');
  const [isSleeping, setIsSleeping] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [musicType, setMusicType] = useState<'lofi' | 'fm' | null>(null);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  
  // --- STATE LƯU TRỮ DANH SÁCH NHẠC TỪ FIREBASE ---
  const [fmStations, setFmStations] = useState<any[]>([]);
  const [lofiTracks, setLofiTracks] = useState<any[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- LOGIC FETCH DỮ LIỆU TỪ FIRESTORE ---
  useEffect(() => {
    const loadMusicData = async () => {
      try {
        // Lấy danh sách đài FM
        const fmDoc = await getDoc(doc(db, "music", "fm_stations"));
        if (fmDoc.exists()) {
          setFmStations(fmDoc.data().list || []);
        }

        // Tương tự cho lofi_tracks (khi bạn tạo xong document này)
        const lofiDoc = await getDoc(doc(db, "music", "lofi_tracks"));
        if (lofiDoc.exists()) {
          setLofiTracks(lofiDoc.data().list || []);
        }
      } catch (error) {
        console.error("Lỗi khi lấy nhạc từ Firebase:", error);
      }
    };
    loadMusicData();
  }, []);

  // --- SỬA LẠI HÀM TOGGLE MUSIC ---
// Thêm async vào đầu hàm
const toggleMusic = async (type: 'lofi' | 'fm', isNext: boolean = false) => {
  if (!audioRef.current) return;
  const audio = audioRef.current;

  // --- 1. XỬ LÝ NÚT STOP ---
  // Nếu không phải bấm Next VÀ đang phát đúng loại đó -> Dừng hẳn
  if (!isNext && isPlaying && musicType === type) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    audio.pause();
    setIsPlaying(false);
    return; // Thoát hàm luôn, không chạy xuống dưới nữa
  }

  // --- 2. DỌN DẸP TRƯỚC KHI PHÁT MỚI ---
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  let source = '';
  if (type === 'fm' && fmStations.length > 0) {
    // Phép toán % giúp quay lại bài đầu tiên khi hết mảng
    const nextIndex = isNext ? (currentStationIndex + 1) % fmStations.length : currentStationIndex;
    setCurrentStationIndex(nextIndex);
    source = fmStations[nextIndex].url;
  } else {
    source = lofiTracks.length > 0 ? lofiTracks[0].url : '/audio/demo.mp3';
  }

  if (source) {
    try {
      audio.src = source;
      audio.load();
      
      setMusicType(type);
      setIsPlaying(true); 

      // --- 3. BẮT LỖI SPAM (AbortError) ---
      await audio.play();
      
    } catch (err: any) {
      // Nếu lỗi là do chúng ta chủ động bấm Stop (AbortError), thì im lặng bỏ qua
      if (err.name === 'AbortError') {
        console.log("Dừng nhạc do người dùng thao tác nhanh.");
        return;
      }

      console.error("Link die thực sự, chuẩn bị nhảy đài...");
      if (type === 'fm' && fmStations.length > 1) {
        timeoutRef.current = setTimeout(() => {
          toggleMusic('fm', true);
        }, 10000);
      } else {
        setIsPlaying(false);
      }
    }
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
        src="/audio/demo.mp3" 
        loop 
        // Khi link nhạc bị lỗi (die), hàm này sẽ tự kích hoạt
        onError={() => {
          if (musicType === 'fm') {
            console.log("Đài đang lỗi, tự động chuyển sang đài tiếp theo...");
            // Đợi 1 giây rồi tự động gọi hàm chuyển đài (isNext = true)
            setTimeout(() => toggleMusic('fm', true), 1000);
          }
        }}
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
        <div className="absolute top-9 right-30 z-50 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-white w-80 shadow-2xl transition-all animate-in fade-in slide-in-from-right-5">
          {activePanel === 'lofi' ? (
            <>
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">🔊 My Speaker</h3>
              <p className="text-[10px] opacity-60 mb-4 uppercase tracking-widest">Local Playlist</p>
              <div className="bg-black/20 rounded-xl p-3 mb-4 border border-white/5">
                <p className="text-sm text-gray-300">Đang phát nhạc từ đảo...</p>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">📻 Vintage Radio</h3>
              <p className="text-[10px] opacity-60 mb-4 uppercase tracking-widest">Live Broadcast</p>
              
              {/* Khung hiển thị tên đài - Tông màu Xanh Dương Chill */}
              <div className="bg-black/30 rounded-xl p-4 mb-4 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <p className="text-[10px] text-blue-400/70 font-mono mb-1 uppercase tracking-wider">
                  Tuning Frequency:
                </p>
                <p className="text-lg font-mono text-blue-400 truncate tracking-tight drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">
                  {fmStations.length > 0 ? fmStations[currentStationIndex]?.name : "Bắt sóng..."}
                </p>
                
                {/* Hiệu ứng sóng nhạc nhỏ (Optional) */}
                {isPlaying && musicType === 'fm' && (
                  <div className="flex gap-1 mt-2 items-end h-3">
                    <div className="w-1 bg-blue-400/60 animate-[pulse_1s_infinite] h-full"></div>
                    <div className="w-1 bg-blue-400/60 animate-[pulse_1.5s_infinite] h-[60%]"></div>
                    <div className="w-1 bg-blue-400/60 animate-[pulse_1.2s_infinite] h-[80%]"></div>
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="flex gap-2">
            {/* Nút Play/Stop */}
            <button 
              onClick={() => toggleMusic(activePanel as 'lofi' | 'fm')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isPlaying && musicType === activePanel 
                  ? 'bg-red-500/40 text-white border border-red-400/50' 
                  : 'bg-white/10 hover:bg-white/20 border border-white/10'
              }`}
            >
              {isPlaying && musicType === activePanel ? 'STOP' : 'START'}
            </button>

            {/* Nút Next Station (Chỉ dành cho FM) */}
            {activePanel === 'fm' && (
              <button 
                onClick={() => toggleMusic('fm', true)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all active:scale-90"
              >
                ⏭️
              </button>
            )}
          </div>

          {/* Nút Đóng nhanh bảng điều khiển */}
          <button 
            onClick={() => setActivePanel(null)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white/20 hover:bg-white/40 rounded-full text-xs flex items-center justify-center backdrop-blur-md border border-white/20"
          >
            ✕
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