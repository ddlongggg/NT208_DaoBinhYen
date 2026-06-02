"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import * as faceapi from 'face-api.js';
import styles from './honuoc.module.css';

type TimeSession = 'night' | 'sunrise' | 'midday' | 'afternoon';

const HoNuocPage = () => {
  //Check user
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  //Check Thời gian để hiện ảnh
  const [session, setSession] = useState<TimeSession>('midday');
  const [status, setStatus] = useState<'idle' | 'preparing' | 'watching' | 'healing'>('idle');
  //Quản lí nhạc nền
  const audioRef = useRef<HTMLAudioElement | null>(null);
  //Nút âm lượng
  const [volume, setVolume] = useState(0.5); // Mặc định 50%
  //Hiệu ứng sóng nước
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [drops, setDrops] = useState<{ id: number; x: number; y: number; tx: string; ty: string; size: number }[]>([]);
  //Gương thần
  const [isOpen, setIsOpen] = useState(false);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  //Lời nhắn chữa lành
  const [message, setMessage] = useState("");
  const fallbackEmotionsMessages: Record<string, string[]> = {
    happy: [
      "Mặt hồ nhìn thấy nụ cười rạng rỡ của bạn. Hãy giữ ngọn lửa lạc quan này và làm chỗ dựa tinh thần cho chính mình nhé, nụ cười của bạn thực sự rất đẹp.",
      "Niềm vui lan tỏa từ bạn gợn lên những làn sóng hạnh phúc trên mặt hồ tĩnh lặng."
    ],
    sad: [
      "Ánh mắt bạn phảng phất một chút đượm buồn và mỏi mệt. Không sao cả, nơi mặt hồ tĩnh lặng này, bạn được phép trút bỏ sự mạnh mẽ để làn nước xoa dịu tâm hồn.",
      "Nỗi buồn của bạn, mặt hồ xin được lắng nghe và ôm lấy thật dịu dàng."
    ],
    neutral: [
      "Sự điềm tĩnh và sâu lắng trong tâm hồn bạn đang phản chiếu rõ nét trên mặt hồ. Bạn kiên cường và vững chãi hơn những gì bản thân tự nhìn nhận rất nhiều."
    ],
    angry: [
      "Có điều gì ngoài kia đang làm bạn bực dọc và căng thẳng sao? Hãy hít một hơi thật sâu, để tiếng nước chảy hạ hỏa ngọn lửa trong lòng bạn xuống nhé."
    ],
    surprised: [
      "Mặt hồ cảm nhận được sự bất ngờ và xao động trong ánh mắt bạn. Hãy thả lỏng lồng ngực, những điều bất định ngoài kia rồi sẽ sớm qua đi và nhường chỗ cho sự bình yên."
    ],
    fearful: [
      "Một chút lo âu và bồn chồn đang gợn sóng trong tâm trí bạn. Đừng sợ hãi, mặt hồ tĩnh lặng này luôn ở đây để bao bọc và chở che cho bạn trước những giông bão."
    ],
    default: [
      "Mặt hồ yên ả dịu dàng nhìn ngắm bóng hình bạn. Dù thế giới ngoài kia có ra sao, nơi đây luôn dang rộng vòng tay đón nhận con người nguyên bản của bạn."
    ]
  };

  //Lấy ảnh
  const bgImages: Record<TimeSession, string> = {
    night: '/honuoc/night.jpg',
    sunrise: '/honuoc/sunrise.jpg',
    midday: '/honuoc/midday.jpg',
    afternoon: '/honuoc/afternoon.jpg'
  };

  const handleWaterAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickId = Date.now();

    // 🔊 1. PHÁT TIẾNG ĐỘNG GIỌT NƯỚC RƠI
    try {
      const clickAudio = new Audio('/audio/water-click.m4a');
      const audioClone = clickAudio.cloneNode(true) as HTMLAudioElement;
      audioClone.volume = volume * 0.8;
      const playPromise = audioClone.play();

      if (playPromise !== undefined) {
        playPromise.catch(err => console.log("Chờ người dùng tương tác để phát âm thanh click:", err));
      }
    } catch (soundErr) {
      console.error("Không thể tải file âm thanh click:", soundErr);
    }

    const newRipple = { id: clickId, x, y };
    setRipples((prev) => [...prev, newRipple]);

    const newDrops = Array.from({ length: 5 }).map((_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      return {
        id: clickId + index,
        x,
        y,
        tx: `${Math.cos(angle) * distance}px`,
        ty: `${Math.sin(angle) * distance}px`,
        size: 3 + Math.random() * 4
      };
    });
    setDrops((prev) => [...prev, ...newDrops]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== clickId));
      setDrops((prev) => prev.filter((d) => d.id < clickId || d.id >= clickId + 5));
    }, 3500);
  };

  const startHealing = async () => {
    setStatus('preparing');
    setCapturedImg(null);
    setCountdown(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setTimeout(() => {
        setStatus('watching');
        setCountdown(5);
      }, 3500);

    } catch (err) {
      console.error("Không thể mở camera:", err);
      setTimeout(() => {
        fetchFirebaseEmotionMessage('neutral');
        setStatus('healing');
      }, 3000);
      return;
    }
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');

      const displayWidth = video.clientWidth;
      const displayHeight = video.clientHeight;

      canvas.width = displayWidth * 2;
      canvas.height = displayHeight * 2;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        const sHeight = sourceHeight;
        const displayAspect = displayWidth / displayHeight;
        const sWidth = sHeight * displayAspect;
        const sX = (sourceWidth - sWidth) / 2;
        const sY = 0;
        ctx.drawImage(
          video,
          sX, sY, sWidth, sHeight,
          0, 0, canvas.width, canvas.height
        );

        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImg(dataUrl);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const analyzeEmotionAndGetMessage = async (videoElement: HTMLVideoElement) => {
    try {
      const detection = await faceapi.detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 256,
          scoreThreshold: 0.1
        })
      ).withFaceExpressions();

      console.log("Kết quả quét khuôn mặt AI thực tế:", detection);

      let primaryEmotion = "neutral";

      if (detection && detection.expressions) {
        const emotions = detection.expressions as unknown as Record<string, number>;

        const weights: Record<string, number> = {
          happy: 1.0,
          neutral: 0.7,
          sad: 2.2,
          angry: 1.6,
          fearful: 2.0,
          surprised: 1.4
        };

        primaryEmotion = Object.keys(emotions).reduce((a, b) => {
          const scoreA = (emotions[a] || 0) * (weights[a] || 1.0);
          const scoreB = (emotions[b] || 0) * (weights[b] || 1.0);
          return scoreA > scoreB ? a : b;
        });

        const actualScore = emotions[primaryEmotion] || 0;
        if (actualScore < 0.05) {
          primaryEmotion = 'neutral';
        }
      }

      console.log(`Cảm xúc xác định: [${primaryEmotion}]. Đang lấy dữ liệu từ Firestore bằng biến db...`);
      await fetchFirebaseEmotionMessage(primaryEmotion);

    } catch (err) {
      console.error("Lỗi phân tích cảm xúc:", err);
      useFallbackEmotionMessage("neutral");
    }
  };

  const fetchFirebaseEmotionMessage = async (emotion: string) => {
    try {

      const docRef = doc(db, "emotion_messages", emotion);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().texts) {
        const textsArray = docSnap.data().texts as string[];
        if (textsArray.length > 0) {
          const randomMsg = textsArray[Math.floor(Math.random() * textsArray.length)];
          setMessage(randomMsg);
          return;
        }
      }

      useFallbackEmotionMessage(emotion);
    } catch (err) {
      console.error(`Lỗi kết nối Firestore cho cảm xúc [${emotion}], chuyển sang danh sách dự phòng:`, err);
      useFallbackEmotionMessage(emotion);
    }
  };

  const useFallbackEmotionMessage = (emotion: string) => {
    const list = fallbackEmotionsMessages[emotion] || fallbackEmotionsMessages["default"];
    const randomMsg = list[Math.floor(Math.random() * list.length)];
    setMessage(randomMsg);
  };



  useEffect(() => {
    setIsClient(true);
    const audio = new Audio('/audio/healing-bg.m4a');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const playAudio = () => {
      audio.play().then(() => {
        window.removeEventListener('click', playAudio);
        window.removeEventListener('touchstart', playAudio);
      }).catch(err => {
        console.log("Trình duyệt chặn autoplay", err);
      });
    };

    playAudio();
    window.addEventListener('click', playAudio);
    window.addEventListener('touchstart', playAudio);

    let timer: NodeJS.Timeout;

    // Tự động tải trước Bộ ba Model AI (Tiny) ngay khi nạp trang để không bị delay khi chụp
    const loadModelsAndInit = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        console.log("Bộ ba AI Tiny Models đã nạp thành công");

        // Khởi tạo thời gian sau khi AI đã sẵn sàng
        const checkTime = () => {
          const hour = new Date().getHours();
          if (hour >= 0 && hour < 5) setSession('night');
          else if (hour >= 5 && hour < 7) setSession('sunrise');
          else if (hour >= 7 && hour < 15) setSession('midday');
          else if (hour >= 15 && hour < 18) setSession('afternoon');
          else setSession('night');
        };
        checkTime();
        timer = setInterval(checkTime, 60000);

      } catch (err) {
        console.error("Lỗi nạp AI Models:", err);
      }
    };
    loadModelsAndInit();

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('click', playAudio);
      window.removeEventListener('touchstart', playAudio);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const triggerAIAndCapture = async () => {
        if (videoRef.current) {
          captureSnapshot();
          setStatus('healing');
          setCountdown(null);
          await analyzeEmotionAndGetMessage(videoRef.current);
          stopCamera();
        }
      };

      triggerAIAndCapture();
    }
  }, [countdown]);



  if (!isClient) return null;

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${bgImages[session]})` }}
    >
      <div className="absolute inset-0 bg-black/20 z-0" />

      {/* VÙNG CHẠM NƯỚC ĐA GIÁC */}
      <div
        onClick={handleWaterAreaClick} // Hàm tính tọa độ tương đối
        className={styles.clickableWater} // Vẽ vùng chạm trong honuoc.module.css
      >
        {/* 🌊 RENDER SÓNG NƯỚC ĐA TẦNG PHÁT SÁNG */}
        {ripples.map((ripple) => (
          <React.Fragment key={ripple.id}>
            {/* Tầng sóng 1 - Lan ra ngay lập tức */}
            <span
              className={styles.waterRipple}
              style={{ left: ripple.x, top: ripple.y, width: '100px', height: '100px' }}
            />
            {/* Tầng sóng 2 - Trễ 0.2s */}
            <span
              className={`${styles.waterRipple} ${styles.rippleDelay1}`}
              style={{ left: ripple.x, top: ripple.y, width: '100px', height: '100px' }}
            />
            {/* Tầng sóng 3 - Trễ 0.4s */}
            <span
              className={`${styles.waterRipple} ${styles.rippleDelay2}`}
              style={{ left: ripple.x, top: ripple.y, width: '100px', height: '100px' }}
            />
          </React.Fragment>
        ))}

        {/* ✨ RENDER CÁC HẠT BỌT NƯỚC LI TI BẮN RA */}
        {drops.map((drop) => (
          <span
            key={drop.id}
            className={styles.waterDrop}
            style={{
              left: drop.x,
              top: drop.y,
              width: `${drop.size}px`,
              height: `${drop.size}px`,
              ['--tx' as any]: drop.tx,
              // 🌟 Ép độ nẩy chiều dọc của bọt nước ngắn lại bằng cách nhân thêm 0.4 để đồng bộ với elip sóng
              ['--ty' as any]: `calc(${drop.ty} * 0.4)`,
            }}
          />
        ))}
      </div>

      {!isOpen && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          className="absolute bottom-[18%] left-[45%] z-20 group text-white text-left border-none outline-none cursor-pointer bg-transparent"
        >
          <div className={`p-4 rounded-xl border transition-all duration-300 backdrop-blur-md bg-white/10 border-white/20 group-hover:bg-blue-500/10 group-hover:border-blue-400/50 shadow-lg`}>
            <p className="font-bold flex items-center gap-2">
              Gương Thần Tâm Hồn
            </p>
            <span className="text-xs opacity-70 block mt-1">
              Click để soi cảm xúc
            </span>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="relative z-10 w-[85%] max-w-5xl aspect-[16/10] md:aspect-video rounded-[3rem] border border-white/10 shadow-[0_0_80px_rgba(30,58,138,0.3)] overflow-hidden bg-black/30 backdrop-blur-2xl animate-in fade-in zoom-in duration-700">

          <button
            onClick={() => { stopCamera(); setIsOpen(false); setStatus('idle'); setCountdown(null); }}
            className="absolute top-8 right-10 z-50 text-white/30 hover:text-white/80 text-2xl transition-colors"
          >
            ✕
          </button>

          <div className="absolute inset-0 flex items-center justify-center">

            {/* TRẠNG THÁI CHỜ (Idle): Biến toàn bộ khung bên trái thành vùng click */}
            {status === 'idle' && (
              <button
                onClick={startHealing}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-blue-950/20 hover:bg-blue-500/10 transition-all duration-500 group"
              >
                <span className="text-white/40 tracking-[0.2em] uppercase text-[11px] font-light group-hover:text-white/80 transition-colors duration-300">
                  Chạm để soi gương thần
                </span>
              </button>
            )}

            {/* LÚC CHUẨN BỊ CHỤP (watching) */}
            {(status === 'preparing' || status === 'watching') && (
              <div className="relative w-full h-full animate-in fade-in duration-1000 flex items-center justify-center bg-black/20 p-6 md:p-10">

                <div className="w-full md:w-[50%] h-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover opacity-85 scale-x-[-1] filter blur-[0.5px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 via-transparent to-transparent mix-blend-color pointer-events-none" />

                  {/*Hiện thông báo nhắc nhở khi ở trạng thái preparing */}
                  {status === 'preparing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 p-6 text-center animate-in fade-in zoom-in duration-500">
                      <div className="text-3xl mb-3 animate-bounce">📸</div>
                      <span className="text-sm md:text-base font-light text-white/90 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        Hãy nhìn thẳng vào mặt hồ để chuẩn bị kết nối tâm hồn...
                      </span>
                    </div>
                  )}

                  {/*Hiện số đếm ngược khi ở trạng thái watching */}
                  {status === 'watching' && countdown !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px] z-20 animate-in fade-in duration-300">
                      {countdown > 0 ? (
                        <>
                          <span className="text-7xl md:text-8xl font-extralight text-white/90 tracking-widest drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-ping absolute">
                            {countdown}
                          </span>
                          <span className="text-7xl md:text-8xl font-extralight text-white/90 tracking-widest drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                            {countdown}
                          </span>
                        </>
                      ) : (
                        // 🌟 Khi đếm về 0, hiện dòng chữ chờ đợi phân tích thay vì để màn hình đứng im
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[4px] animate-in fade-in duration-500">
                          <div className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-4" />
                          <span className="text-xs md:text-sm font-light text-blue-200 tracking-[0.3em] uppercase animate-pulse">
                            Mặt hồ đang lắng nghe cảm xúc...
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="absolute bottom-12 w-full text-center text-blue-200/80 text-sm italic tracking-widest animate-pulse z-10 pointer-events-none">
                  {status === 'preparing' ? "Đang kết nối gương thần..." : "Mặt hồ đang lưu lại bóng hình yên bình của bạn..."}
                </p>
              </div>
            )}

            {/* LÚC HIỂN THỊ KẾT QUẢ (healing) */}
            {status === 'healing' && (
              <div className="w-full h-full flex flex-col md:flex-row animate-in fade-in duration-1000">

                {/* Khung bên trái chứa ảnh kết quả:
                  Sử dụng class w-full md:w-1/2 và ảnh bên trong để object-cover.
                  Vì cả khung video lúc chuẩn bị chụp và khung ảnh chụp này có tỷ lệ hiển thị (Aspect Ratio) đồng nhất với nhau,
                  nên ảnh thành phẩm sẽ trùng khớp hoàn hảo với những gì mắt nhìn thấy trước đó.
                */}
                <div className="w-full md:w-1/2 h-[45%] md:h-full relative border-b md:border-b-0 md:border-r border-white/5 bg-black/20 flex items-center justify-center p-6 md:p-10 overflow-hidden">
                  <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    {capturedImg ? (
                      <img
                        src={capturedImg}
                        alt="Bóng hình phản chiếu"
                        className="w-full h-full object-cover opacity-75 filter sepia-[10%] contrast-[1.05]"
                      />
                    ) : (
                      <div className="text-white/20 text-xs italic flex items-center justify-center h-full">Gương thần tĩnh lặng...</div>
                    )}
                    <div className="absolute inset-0 bg-blue-900/10 mix-blend-color-burn pointer-events-none" />
                  </div>
                </div>

                <div className="w-full md:w-1/2 h-[55%] md:h-full p-8 md:p-12 flex flex-col justify-center items-center text-center md:text-left overflow-y-auto custom-scrollbar">
                  <div className="max-w-md space-y-6">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-blue-400/60 font-semibold block">
                      Lời thì thầm từ mặt hồ
                    </span>
                    <p className="text-base md:text-lg font-light text-slate-200/90 leading-relaxed text-justify md:text-left italic">
                      "{message}"
                    </p>
                    <div className="pt-4 text-center md:text-left">
                      <button
                        onClick={() => setStatus('idle')}
                        className="px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white/80 transition-all shadow-sm"
                      >
                        Nhìn lại lần nữa
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Nút chỉnh âm lượng - Đưa ra giữa, nằm ngang */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 text-white">
        <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Vol</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>

      {/* Nút thoát ra homepage */}
      <Link
        href="/homepage"
        className="absolute cursor-pointer group z-50 flex items-center justify-center font-sans"
        style={{ top: '90%', left: '90%', width: '12%', height: '10%' }}
      >
        <div className="absolute pointer-events-none animate-pulse">
          <span className="text-white/60 font-semibold text-lg tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] whitespace-nowrap">LỐI RA</span>
        </div>

        <div className="absolute top-[-45px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
          <h3 className="text-white font-bold text-sm whitespace-nowrap">Ra khỏi hồ nước</h3>
        </div>
      </Link>

      {/* Status Bar - Đẩy qua góc dưới bên trái, tăng kích thước để che logo Gemini */}
      <div className="absolute bottom-2 left-2 z-10 px-10 py-8 bg-black/90 text-white/60 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
        <p className="text-[11px] font-black tracking-[0.4em] uppercase text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
          {session} mode
        </p>
      </div>
    </div>
  );
};

export default HoNuocPage;