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
  const [currentTrackUrl, setCurrentTrackUrl] = useState<string>(''); // Để hiển thị sóng
  
  // --- STATE LƯU TRỮ DANH SÁCH NHẠC TỪ FIREBASE ---
  const [fmStations, setFmStations] = useState<any[]>([]);
  const [lofiTracks, setLofiTracks] = useState<any[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  //Đếm số lần đài nhảy lỗi
  const retryCountRef = useRef(0);

  //Loa
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  //Nút âm lượng
  const [volume, setVolume] = useState(0.5); // Mặc định 50%

  // Lấy volume toàn cục từ localStorage (0-1)
  const getGlobalVol = (): number => {
    if (typeof window === 'undefined') return 1;
    if (localStorage.getItem('app_muted') === 'true') return 0;
    return Number(localStorage.getItem('app_volume') ?? '70') / 100;
  };

  // Lắng nghe thay đổi volume từ SettingsButton
  useEffect(() => {
    const handler = (e: Event) => {
      const { volume: globalVol, muted: globalMuted } = (e as CustomEvent).detail;
      if (audioRef.current) {
        audioRef.current.volume = globalMuted ? 0 : globalVol;
      }
    };
    window.addEventListener('app-volume-change', handler);
    return () => window.removeEventListener('app-volume-change', handler);
  }, []);

  // Hàm gọi tìm nhạc (Trong database)
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]); // Nếu trống thì không hiện gì
      return;
    }
    
    // Lọc bài hát từ lofiTracks dựa trên tên bài hát (name)
    const results = lofiTracks.filter(track => 
      (track.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, lofiTracks]);

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
const toggleMusic = async (type: 'lofi' | 'fm' , isNext: boolean = false, trackUrl?: string) => {
  if (!audioRef.current) return;
  const audio = audioRef.current;

  // 1. Reset các lệnh cũ ngay lập tức
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  retryCountRef.current = 0; 

  const targetSrc = trackUrl || audio.src || (lofiTracks.length > 0 ? lofiTracks[0].url : '/audio/demo.mp3');
  const isChangingTrack = trackUrl && audio.src !== trackUrl;

  // Logic Bật/Tắt (Chỉ tắt khi bấm nút START/STOP của chính bài đang phát)
  if (!isNext && !isChangingTrack && isPlaying && musicType === type && !trackUrl) {
    audio.pause();
    setIsPlaying(false);
    return;
  }

  // 2. Kiểm tra lệnh STOP (Chỉ dừng khi bấm cùng loại và không phải chuyển bài)
  if (!isNext && isPlaying && musicType === type && !trackUrl) {
    audio.pause();
    setIsPlaying(false);
    return;
  }

  // 3. Xác định nguồn nhạc (Đã lược bỏ Search rườm rà)
  let source = '';
  if (type === 'fm' && fmStations.length > 0) {
    const nextIndex = isNext ? (currentStationIndex + 1) % fmStations.length : currentStationIndex;
    setCurrentStationIndex(nextIndex);
    source = fmStations[nextIndex].url;
  } else {
    // Ưu tiên trackUrl người dùng bấm vào -> nếu không có thì lấy bài đầu tiên trong kho -> cuối cùng là demo
    source = trackUrl || (lofiTracks.length > 0 ? lofiTracks[0].url : '/audio/demo.mp3');
  }

  // 4. Phát nhạc
  try {
    if (isChangingTrack || audio.src !== source || !audio.src) {
      audio.src = source;
      setCurrentTrackUrl(source); // Cập nhật để UI biết đang phát bài/đài nào
      audio.load();
    } else {
      setCurrentTrackUrl(audio.src);
    }

    audio.volume = getGlobalVol();
    setMusicType(type);
    await audio.play();
    setIsPlaying(true);
    retryCountRef.current = 0; // Phát thành công thì reset đếm lỗi

  } catch (err: any) {
    if (err.name === 'AbortError') return;
    
    // Xử lý nhảy đài FM khi lỗi
    if (type === 'fm' && fmStations.length > 0) {
      retryCountRef.current += 1;
      if (retryCountRef.current >= fmStations.length) {
        retryCountRef.current = 0;
        toggleMusic('lofi'); // Hỏng hết đài thì về nhạc Lofi
      } else {
        timeoutRef.current = setTimeout(() => toggleMusic('fm', true), 2000);
      }
    }
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
      {/* NÚT CÀI ĐẶT */}
      {activePanel && (
        <div className="absolute top-20 right-20 z-50 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-white w-80 shadow-2xl transition-all animate-in fade-in slide-in-from-right-5">
          {activePanel === 'lofi' ? (
              <>
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">🔊 My Speaker</h3>
                <p className="text-[10px] opacity-60 mb-4 uppercase tracking-widest">Music Finder</p>
                
                {/* Ô Search */}
                <div className="flex gap-2 bg-black/30 p-2 rounded-xl border border-white/10 mb-4">
                  <input 
                    className="flex-1 bg-transparent outline-none text-sm px-2 text-white"
                    placeholder="Tìm tên bài hát..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button onClick={handleSearch} className="text-blue-400 hover:scale-110 transition-transform">🔍</button>
                </div>

                {/* Danh sách kết quả từ kho Lofi Firestore */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4">
                  {(searchQuery ? searchResults : lofiTracks).length > 0 ? (
                    (searchQuery ? searchResults : lofiTracks).map((track, index) => ( // Thêm index vào đây để làm key
                      <div 
                        key={index} 
                        onClick={() => toggleMusic('lofi', false, track.url)} 
                        className={`flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl cursor-pointer border transition-all ${
                          currentTrackUrl.includes(track.url) 
                            ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                            : 'border-white/5 bg-black/40'
                        }`}
                      >
                        {/* Icon nốt nhạc mộc mạc */}
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs shadow-inner">
                          🎵
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <p className="text-[11px] font-black text-white truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] tracking-wide">
                            {track.name || "Untitled Track"}
                          </p>
                          <p className="text-[9px] text-white/40 uppercase tracking-tighter">Local Storage</p>
                        </div>

                        {/* Hiệu ứng sóng nhạc - Đã sửa lỗi so sánh track.url */}
                        {isPlaying && currentTrackUrl.includes(track.url) && (
                          <div className="flex gap-0.5 items-end h-3 mb-1">
                            <div className="w-0.5 bg-blue-400 animate-bounce h-full"></div>
                            <div className="w-0.5 bg-blue-400 animate-bounce h-[60%] [animation-delay:0.2s]"></div>
                            <div className="w-0.5 bg-blue-400 animate-bounce h-[80%] [animation-delay:0.4s]"></div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5 text-center backdrop-blur-sm">
                      <p className="text-[11px] font-medium text-white/50 tracking-wide">
                        {searchQuery ? "Không tìm thấy giai điệu này..." : "Tìm kiếm trong kho nhạc Lofi của bạn..."}
                      </p>
                    </div>
                  )}
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
            {/* Nút Play/Stop dưới cùng của Panel */}
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
        onClick={() => setActivePanel(activePanel === 'lofi' ? null : 'lofi')} 
        className="absolute bottom-[20%] left-[12%] z-20 group"
      >
        <div className={`p-4 rounded-xl border transition-all backdrop-blur-md ${
          isPlaying && musicType === 'lofi' ? 'bg-green-500/20 border-green-400' : 'bg-white/10 border-white/20'
        }`}>
          <p className="font-bold">
            {/* Icon sẽ đổi màu khi đang phát bất cứ thứ gì từ Loa (lofi hoặc search) */}
            {isPlaying && (musicType === 'lofi') ? '⏸ Music Playing' : '🔊 Lo-fi Speaker'}
          </p>
          <span className="text-xs opacity-70">
            Click to Open Player
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
        onClick={() => setIsSleeping(!isSleeping)}
        className="absolute bottom-[15%] right-[20%] z-20 group"
      >
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-white group-hover:scale-110 transition-all">
          <p className="font-bold">🧶 The Hammock</p>
          <span className="text-xs opacity-70">{isSleeping ? 'Wake up' : 'Take a nap'}</span>
        </div>
      </button>

        {/* Nút chỉnh âm lượng - Đưa ra giữa, nằm ngang */}

        {/* Status Bar - Đẩy qua góc dưới bên phải, tăng kích thước để che logo Gemini */}
        <div className="absolute bottom-2 right-2 z-10 px-10 py-8 bg-black/90 text-white/60 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
          <p className="text-[11px] font-black tracking-[0.4em] uppercase text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
            {session} mode
          </p>
        </div>
      </div>
  );
};
export default WoodHousePage;
