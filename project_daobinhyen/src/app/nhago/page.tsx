"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Khai báo kiểu dữ liệu cho trạng thái thời gian
type TimeSession = 'night' | 'sunrise' | 'midday' | 'afternoon';

const WoodHousePage: React.FC = () => {
  const router = useRouter(); // Khởi tạo router
  const [session, setSession] = useState<TimeSession>('midday');
  const [isSleeping, setIsSleeping] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);

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
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white group-hover:bg-white/20 transition-all">
          <p className="font-bold">🔊 Lo-fi Speaker</p>
          <span className="text-xs opacity-70">Focus mode</span>
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

      {/* --- PANEL ĐIỀU KHIỂN NHẠC --- */}
      {activePanel && (
        <div className="absolute top-10 right-10 z-30 bg-black/60 backdrop-blur-lg p-6 rounded-2xl text-white w-64 border border-white/10 animate-fade-in">
          <h3 className="text-xl font-semibold mb-2">
            {activePanel === 'lofi' ? '🎵 Lofi Beats' : '📻 Live Radio'}
          </h3>
          <p className="text-sm opacity-80 mb-4 italic">
            "Sự bình yên trong từng nốt nhạc..."
          </p>
          <button className="w-full bg-white/20 py-2 rounded-lg hover:bg-white/30 transition-colors">
            Play / Pause
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