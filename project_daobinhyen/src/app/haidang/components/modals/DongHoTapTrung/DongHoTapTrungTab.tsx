'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Award } from 'lucide-react';
import { auth } from '@/app/lib/firebase';
import { addGold } from '@/app/api/user/lighthouse/taskService';
import { onAuthStateChanged } from 'firebase/auth';

export default function DongHoTapTrungTab() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const finishAudioRef = useRef<HTMLAudioElement | null>(null);
  const rewardAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    clickAudioRef.current = new Audio('/Lighthouse/SoundEffect/hit-table.mp3');
    if (clickAudioRef.current) clickAudioRef.current.volume = 0.4;
    
    finishAudioRef.current = new Audio('/Lighthouse/SoundEffect/wave-crash.mp3');
    if (finishAudioRef.current) finishAudioRef.current.volume = 0.4;
    
    rewardAudioRef.current = new Audio('/Lighthouse/SoundEffect/coins-jingle.mp3');
    if (rewardAudioRef.current) rewardAudioRef.current.volume = 0.4;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : 'test-user-id');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    if (timeRemaining <= 0) {
      setIsRunning(false);
      handleFinish();
      return;
    }
    const interval = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const handleStart = () => {
    clickAudioRef.current?.play();
    if (timeRemaining === 0) {
      const totalSecs = hours * 3600 + minutes * 60 + seconds;
      if (totalSecs === 0) return;
      setTotalDuration(totalSecs);
      setTimeRemaining(totalSecs);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    clickAudioRef.current?.play();
    setIsRunning(false);
  };

  const handleStop = () => {
    clickAudioRef.current?.play();
    setIsRunning(false);
    setTimeRemaining(0);
    setTotalDuration(0);
  };

  const handleFinish = async () => {
    if (!userId) return;
    if (totalDuration < 60) return; // Dưới 1 phút không nhận gì cả
    const reward = Math.floor(totalDuration / 60); // 1 phút = 1 đồng
    setRewardAmount(reward);
    try {
      if (reward > 0) {
        await addGold(userId, reward);
        window.dispatchEvent(new Event('GOLD_UPDATED'));
      }
      setShowReward(true);
      finishAudioRef.current?.play();
      setTimeout(() => rewardAudioRef.current?.play(), 1000);
    } catch (e) {
      console.error('Lỗi thêm vàng:', e);
    }
  };

  // progress: 0 = mới bắt đầu (cát trên đầy, dưới rỗng)
  //           1 = hết giờ (cát trên rỗng, dưới đầy)
  const progress = totalDuration > 0
    ? Math.max(0, Math.min(1, 1 - timeRemaining / totalDuration))
    : 0;

  // ============================================================
  // CLIP-PATH CHO CÁT
  // Tất cả % là tính trên chiều cao TOÀN BỘ ảnh (0%=đỉnh, 100%=đáy)
  // Các con số dưới đây ước lượng vị trí nội dung trong từng ảnh PNG.
  // Điều chỉnh TOP_BOT / BOT_TOP nếu cần sau khi quan sát.
  // ============================================================

  // TopSand: ảnh hiển thị cát ĐẦY ở bầu TRÊN.
  // Nội dung cát nằm từ ~15% đến ~50% chiều cao ảnh.
  // Cát trong bầu trên luôn nằm ở ĐÁY bầu (sát cổ đồng hồ).
  // Khi cát vơi: MẶT TRÊN của cát hạ xuống → clip từ TRÊN xuống tăng dần.
  // Đáy cố định tại cổ (~50%), top clip tăng từ ~15% → ~50%.
  // inset(TOP% 0 BOTTOM_FIXED% 0):
  // - progress=0: TOP=15% → thấy rows 15%→50% → đầy cát
  // - progress=1: TOP=50% → thấy rows 50%→50% = rỗng
  const topClipTop_start = 23.5;  // vị trí mặt cát khi đầy (% từ đỉnh ảnh)
  const topClipTop_end = 50;  // vị trí khi cạn hết = cổ đồng hồ
  const topClipBottom_fixed = 50; // đáy cố định tại cổ (clip 50% từ dưới)
  const topClipTop = topClipTop_start + progress * (topClipTop_end - topClipTop_start);
  const topSandClip = `inset(${topClipTop}% 0 ${topClipBottom_fixed}% 0)`;

  // BotSand: ảnh hiển thị cát ĐẦY ở bầu DƯỚI.
  // Nội dung cát nằm từ ~50% đến ~85% chiều cao ảnh.
  // Khi cát dâng lên: ta ẩn phần TRÊN của ảnh dần dần (clipPath cắt từ trên xuống, giảm dần).
  // inset(TOP% 0 0 0): ẩn từ 0% đến TOP%.
  // - progress=0: TOP=100% → ẩn top 100% → chỉ thấy ~0% đáy (gần như rỗng)
  // - progress=1: TOP=50% → ẩn top 50% → thấy bầu dưới đầy cát
  const botTop_start = 76.5;
  const botTop_end = 50;
  const botClipTop = botTop_start + progress * (botTop_end - botTop_start);
  const botSandClip = `inset(${botClipTop}% 0 0 0)`;

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isActive = isRunning || timeRemaining > 0;
  const sandFlowing = isRunning && progress > 0 && progress < 1;

  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-[#1A1A24] rounded-2xl overflow-hidden border-2 border-[#D2B48C]">
      {/* Background stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1021] via-[#1A1A24] to-[#2B231D]" />
        <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse opacity-70" />
        <div className="absolute top-[30%] left-[80%] w-1.5 h-1.5 bg-yellow-100 rounded-full animate-ping opacity-50" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[60%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse opacity-80" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[20%] left-[60%] w-2 h-2 bg-blue-100 rounded-full animate-pulse opacity-40" style={{ animationDuration: '5s' }} />
        <div className="absolute top-[80%] left-[75%] w-1 h-1 bg-white rounded-full animate-pulse opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
      </div>

      {/* ===== CARD THỐNG NHẤT: ĐỒNG HỒ + ĐIỀU KHIỂN ===== */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex flex-col md:flex-row items-center bg-[#2B231D]/80 backdrop-blur-md rounded-3xl border border-[#D2B48C]/30 shadow-2xl overflow-hidden">

          {/* ─── Nửa trái: Đồng hồ cát ─── */}
          {/*
            Chiến lược render:
            - Container "relative" với width cố định.
            - glass.png là phần tử FLOW (block, h-auto) → xác định chiều cao container.
            - Các lớp cát dùng "absolute inset-0" → khớp chính xác với kích thước glass.png.
          */}
          <div className="flex items-center justify-center p-10 md:border-r border-[#D2B48C]/20">
            <div className="relative flex-shrink-0 w-[180px] md:w-[220px] drop-shadow-[0_0_25px_rgba(210,180,140,0.3)]">

          {/* Lớp 1 (z-10): Cát bầu TRÊN */}
          <div
            className="absolute inset-0 z-10"
            style={{
              clipPath: topSandClip,
              transition: 'clip-path 1s linear',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lighthouse/hourglass/TopSand.png"
              alt=""
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>

          {/* Lớp 2 (z-20): Cát bầu DƯỚI – cao hơn SandStream để không bị che */}
          <div
            className="absolute inset-0 z-20"
            style={{
              clipPath: botSandClip,
              transition: 'clip-path 1s linear',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lighthouse/hourglass/BotSand.png"
              alt=""
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>

          {/* Lớp 3 (z-15): Dòng cát chảy ở cổ chai – nằm DƯỚI BotSand (z-20) */}
          {/*
            Vị trí cổ chai của đồng hồ cát trong ảnh: khoảng 46%~54% chiều cao.
            SandStream.png được hiển thị TOÀN BỘ ảnh, chứa hiệu ứng hạt cát ở giữa.
            Dùng overflow-hidden + opacity để kiểm soát.
          */}
          <div
            className={`absolute inset-0 z-15 transition-opacity duration-500 ${sandFlowing ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lighthouse/hourglass/SandStream.png"
              alt=""
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>

          {/* Lớp 4 (z-30): Khung thủy tinh – LUÔN ở trên cùng, xác định kích thước container */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lighthouse/hourglass/glass.png"
            alt="Đồng hồ cát"
            className="w-full h-auto block relative z-30 pointer-events-none"
          />

            </div>{/* end relative hourglass */}
          </div>{/* end nửa trái */}

          {/* ─── Nửa phải: Bảng điều khiển ─── */}
          <div className="flex flex-col items-center p-8 flex-1 w-full">
            <h2 className="text-xl font-bold text-[#E8D4BB] mb-5 tracking-wider">THIẾT LẬP THỜI GIAN</h2>

          {/* Đồng hồ đếm ngược hoặc Input */}
          {isActive ? (
            <div className="text-6xl text-amber-400 mb-8 font-bold tracking-wider tabular-nums drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              {formatTime(timeRemaining)}
            </div>
          ) : (
            <div className="flex gap-3 mb-8 items-center">
              <div className="flex flex-col items-center">
                <input
                  type="number" min="0" max="23" value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 h-14 text-center text-2xl font-bold bg-[#1A1A24] text-amber-200 rounded-xl border border-[#8B5A2B] focus:outline-none focus:border-amber-400"
                />
                <span className="text-[#D2B48C] text-xs mt-1">Giờ</span>
              </div>
              <span className="text-2xl text-[#8B5A2B] pb-4">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number" min="0" max="59" value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-14 h-14 text-center text-2xl font-bold bg-[#1A1A24] text-amber-200 rounded-xl border border-[#8B5A2B] focus:outline-none focus:border-amber-400"
                />
                <span className="text-[#D2B48C] text-xs mt-1">Phút</span>
              </div>
              <span className="text-2xl text-[#8B5A2B] pb-4">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number" min="0" max="59" value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-14 h-14 text-center text-2xl font-bold bg-[#1A1A24] text-amber-200 rounded-xl border border-[#8B5A2B] focus:outline-none focus:border-amber-400"
                />
                <span className="text-[#D2B48C] text-xs mt-1">Giây</span>
              </div>
            </div>
          )}

          {/* Thanh tiến độ */}
          {isActive && (
            <div className="w-full bg-[#1A1A24] rounded-full h-2 mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-300 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          {/* Nút điều khiển */}
          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.4)]"
              >
                <Play size={18} fill="currentColor" />
                {timeRemaining > 0 ? 'Tiếp Tục' : 'Bắt Đầu'}
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#8B6914] hover:bg-[#A07818] text-[#F5E6D3] font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(139,105,20,0.4)] border border-[#D2B48C]/30"
              >
                <Pause size={18} fill="currentColor" /> Tạm Dừng
              </button>
            )}
            <button
              onClick={handleStop}
              disabled={!isActive}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4A2E18] hover:bg-[#5C3A21] disabled:opacity-40 disabled:cursor-not-allowed text-[#D2B48C] font-bold rounded-xl transition-all border border-[#8B5A2B]/50"
            >
              <Square size={18} fill="currentColor" /> Dừng
            </button>
          </div>

          {/* Tip */}
          {!isActive && (
            <p className="text-[#D2B48C]/50 text-xs mt-5 text-center">
              Nhập thời gian và nhấn Bắt Đầu để tập trung 🌊
            </p>
          )}
          </div>{/* end bảng điều khiển */}
        </div>{/* end card thống nhất */}
      </div>{/* end z-10 wrapper */}

      {/* ===== MODAL CHÚC MỪNG ===== */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              className="bg-gradient-to-br from-[#F5E6D3] to-[#E8D4BB] p-8 rounded-3xl flex flex-col items-center border-4 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)] max-w-xs text-center mx-4"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 border border-amber-300">
                <Award size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-[#5C3A21] mb-2">Hoàn Thành Tuyệt Vời!</h2>
              <p className="text-[#8B5A2B] text-sm font-medium mb-5">
                Bạn đã tập trung trong {formatTime(totalDuration)}.<br />
                Sự nỗ lực của bạn đã được đền đáp!
              </p>
              <div className="flex items-center gap-2 bg-[#5C3A21] px-5 py-2 rounded-full mb-6">
                <span className="text-white text-sm font-medium">Phần thưởng:</span>
                <span className="text-amber-400 font-black text-lg">+{rewardAmount}</span>
                <div className="w-4 h-4 rounded-full bg-amber-400 border border-yellow-200 flex items-center justify-center text-[9px] font-black text-amber-900">V</div>
              </div>
              <button
                onClick={() => setShowReward(false)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all"
              >
                Nhận Thưởng & Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
