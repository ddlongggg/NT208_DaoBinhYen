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
  const [musicType, setMusicType] = useState<'lofi' | 'fm' | 'search' | null>(null);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  
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
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchUrl, setSelectedSearchUrl] = useState<string | null>(null); //Ghi nhớ bài hát đang chọn

  // Hàm gọi API tìm nhạc ( iTunes miễn phí, không cần key)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&limit=10&media=music`);
      const data = await res.json();
      setSearchResults(data.results);
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
    } finally {
      setIsSearching(false);
    }
  };

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
const toggleMusic = async (type: 'lofi' | 'fm' | 'search', isNext: boolean = false, searchUrl?: string) => {
  if (!audioRef.current) return;
  const audio = audioRef.current;

  // 1. Reset các lệnh cũ ngay lập tức
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
  retryCountRef.current = 0; 

  // 2. Kiểm tra lệnh STOP (Chỉ dừng khi bấm cùng loại và không phải chuyển bài)
  if (!isNext && isPlaying && !searchUrl) {
    const isStoppingFM = type === 'fm' && musicType === 'fm';
    const isStoppingLofiOrSearch = (type === 'lofi' || type === 'search') && (musicType === 'lofi' || musicType === 'search');
    
    if (isStoppingFM || isStoppingLofiOrSearch) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
  }

  // 3. Xác định nguồn nhạc
  let source = '';
  let finalType: 'lofi' | 'fm' | 'search' = type;

  if (type === 'fm' && fmStations.length > 0) {
    const nextIndex = isNext ? (currentStationIndex + 1) % fmStations.length : currentStationIndex;
    setCurrentStationIndex(nextIndex);
    source = fmStations[nextIndex].url;
  } else {
    // Ưu tiên link mới từ Search -> Link đã chọn trước đó -> Nhạc Lofi
    source = searchUrl || selectedSearchUrl || (lofiTracks.length > 0 ? lofiTracks[0].url : '/audio/demo.mp3');
    if (searchUrl) setSelectedSearchUrl(searchUrl);
    finalType = (searchUrl || selectedSearchUrl) ? 'search' : 'lofi';
  }

  // 4. THỰC HIỆN PHÁT NHẠC NGAY LẬP TỨC
  if (source) {
    try {
      // Quan trọng: Gán src mới và gọi load() ngay
      audio.src = source;
      audio.load(); 
      
      // Cập nhật trạng thái hiển thị trước khi await play()
      setMusicType(finalType);
      setIsPlaying(true);

      // Ép trình duyệt phát nhạc
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      console.log("Đang phát bài mới:", source);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Lỗi phát nhạc:", err);
      
      // Logic tự động nhảy đài FM khi lỗi
      if (type === 'fm' && fmStations.length > 0) {
        retryCountRef.current += 1;
        // --- SỬA TẠI ĐÂY: NẾU HỎNG HẾT THÌ PHÁT DEMO ---
        if (retryCountRef.current >= fmStations.length) {
          console.log("Tất cả đài FM lỗi, chuyển sang nhạc Demo...");
          retryCountRef.current = 0;
          
          // Gọi lại chính nó với type lofi để kích hoạt nhạc demo/mặc định
          toggleMusic('lofi'); 
          return;
        }
        if (retryCountRef.current < fmStations.length) {
          timeoutRef.current = setTimeout(() => toggleMusic('fm', true), 3000); // Giảm xuống 3s cho nhanh
        } else {
          setIsPlaying(false);
        }
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
        onClick={() => setActivePanel(activePanel === 'lofi' ? null : 'lofi')} 
        className="absolute bottom-[20%] left-[12%] z-20 group"
      >
        <div className={`p-4 rounded-xl border transition-all backdrop-blur-md ${
          isPlaying && musicType === 'lofi' ? 'bg-green-500/20 border-green-400' : 'bg-white/10 border-white/20'
        }`}>
          <p className="font-bold">
            {/* Icon sẽ đổi màu khi đang phát bất cứ thứ gì từ Loa (lofi hoặc search) */}
            {isPlaying && (musicType === 'lofi' || musicType === 'search') ? '⏸ Music Playing' : '🔊 Lo-fi Speaker'}
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

                {/* Danh sách kết quả Search */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4">
                  {isSearching ? (
                    <p className="text-center text-[10px] animate-pulse py-4">ĐANG TÌM KIẾM...</p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((track) => (
                      <div 
                        key={track.trackId}
                        onClick={() => toggleMusic('search', false, track.previewUrl)}
                        className={`flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg cursor-pointer border transition-all ${
                          audioRef.current?.src === track.previewUrl ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5'
                        }`}
                      >
                        <img src={track.artworkUrl30} className="w-8 h-8 rounded" alt="" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[11px] font-bold truncate">{track.trackName}</p>
                          <p className="text-[9px] opacity-50 truncate">{track.artistName}</p>
                        </div>
                        {isPlaying && audioRef.current?.src === track.previewUrl && (
                          <div className="flex gap-0.5 items-end h-2">
                            <div className="w-0.5 bg-blue-400 animate-bounce h-full"></div>
                            <div className="w-0.5 bg-blue-400 animate-bounce h-[60%] [animation-delay:0.2s]"></div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                      <p className="text-[11px] text-gray-400">Hãy tìm bài hát bạn yêu thích...</p>
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
              onClick={() => {
                // Nếu đang phát nhạc Search, bấm nút này sẽ truyền type 'search' để dừng
                const callType = (activePanel === 'lofi' && musicType === 'search') ? 'search' : (activePanel as 'lofi' | 'fm');
                toggleMusic(callType);
              }}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isPlaying && (
                  musicType === activePanel || 
                  (activePanel === 'lofi' && musicType === 'search') // THÊM ĐIỀU KIỆN NÀY
                )
                  ? 'bg-red-500/40 text-white border border-red-400/50' 
                  : 'bg-white/10 hover:bg-white/20 border border-white/10'
              }`}
            >
              {/* Hiển thị chữ STOP nếu nhạc đang phát tương ứng với Panel đang mở */}
              {isPlaying && (
                musicType === activePanel || 
                (activePanel === 'lofi' && musicType === 'search') // THÊM ĐIỀU KIỆN NÀY
              ) ? 'STOP' : 'START'}
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