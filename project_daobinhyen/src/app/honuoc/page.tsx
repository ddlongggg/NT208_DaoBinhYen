"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

type TimeSession = 'dem' | 'rangsang' | 'truagat' | 'chieumuon';

const HoNuocPage = () => {
  const router = useRouter();
  const [session, setSession] = useState<TimeSession>('truagat');
  const [status, setStatus] = useState<'idle' | 'watching' | 'healing'>('idle');
  const [message, setMessage] = useState("");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  //Quản lí nhạc nền
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fallbackMessages = [
    "Nhìn sâu vào mặt hồ, bạn có nhìn thấy một tâm hồn đã đi qua biết bao ghềnh thác nhưng chưa một lần bỏ cuộc? Những vết hằn tháng năm không làm bạn bớt lấp lánh, chúng là minh chứng cho sự kiên cường của riêng bạn. Hãy để làn nước mát dịu này ôm lấy toàn bộ sự mỏi mệt, xoa dịu đi những lo toan mà bạn đang gồng gánh trên vai suốt thời gian qua. Bạn xứng đáng được yêu thương, được trân trọng, và hơn hết, xứng đáng có một khoảng lặng bình yên ngay lúc này.",
    "Mặt hồ yên ả dịu dàng như chính bản chất con người bạn khi trút bỏ đi những áp lực của thế giới ngoài kia. Đừng vội vã, hãy hít một hơi thật sâu. Thế giới có thể đòi hỏi bạn phải hoàn hảo, nhưng nơi đây chỉ cần bạn là chính mình – nguyên bản, chân thật và tràn đầy giá trị. Ngày hôm nay, dù có điều gì xảy ra, hãy mỉm cười với bóng hình phản chiếu trong nước, bởi vì tồn tại của bạn đã là một điều vô cùng kỳ diệu rồi."
  ];

  useEffect(() => {
    setIsClient(true);

    // 1. Tải trước file nhạc vào bộ nhớ khi trang được nạp
    const audio = new Audio('/audio/healing-bg.m4a'); 
    audio.loop = true; // Cho nhạc lặp đi lặp lại vô tận
    audio.volume = 0.3; // Âm lượng vừa phải du dương
    audioRef.current = audio;

    // 2. 🚀 HÀM TỰ ĐỘNG PHÁT NHẠC NGAY KHI VÀO TRANG
    const playAudio = () => {
      audio.play().then(() => {
        // Nếu phát thành công, gỡ bỏ các sự kiện lắng nghe tương tác để tránh kích hoạt lại
        window.removeEventListener('click', playAudio);
        window.removeEventListener('touchstart', playAudio);
      }).catch(err => {
        console.log("Trình duyệt chặn autoplay, chờ người dùng click/chạm để phát:", err);
      });
    };

    // Chạy thử lệnh phát ngay lập tức
    playAudio();

    // Nếu trình duyệt chặn, lắng nghe tương tác đầu tiên của người dùng để phát bù nhạc ngay
    window.addEventListener('click', playAudio);
    window.addEventListener('touchstart', playAudio);

    const checkTime = () => {
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5) setSession('dem');
        else if (hour >= 5 && hour < 7) setSession('rangsang');
        else if (hour >= 7 && hour < 15) setSession('truagat');
        else if (hour >= 15 && hour < 18) setSession('chieumuon');
        else setSession('dem');
      };
      checkTime(); 
      const timer = setInterval(checkTime, 60000);
      return () => {
        clearInterval(timer);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };  
  }, []);

  const bgImages: Record<TimeSession, string> = {
    dem: '/honuoc/dem.jpg',
    rangsang: '/honuoc/rangsang.jpg',
    truagat: '/honuoc/truagat.jpg',
    chieumuon: '/honuoc/hieumuon.jpg'
  };

  const fetchFirebaseMessage = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "healing_messages"));
      const messagesList: string[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().text) messagesList.push(doc.data().text);
      });

      if (messagesList.length > 0) {
        const randomMsg = messagesList[Math.floor(Math.random() * messagesList.length)];
        setMessage(randomMsg);
      } else {
        useFallbackMessage();
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu từ Firebase, đang dùng tin nhắn dự phòng:", err);
      useFallbackMessage();
    }
  };

  const useFallbackMessage = () => {
    const randomMsg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    setMessage(randomMsg);
  };

  const startHealing = async () => {
    setStatus('watching');
    setCapturedImg(null);
    setCountdown(5);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Không thể mở camera:", err);
      setCountdown(null);
      setTimeout(() => {
        fetchFirebaseMessage();
        setStatus('healing');
      }, 3000);
      return;
    }
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      captureSnapshot();
      stopCamera();
      fetchFirebaseMessage();
      setStatus('healing');
      setCountdown(null);
    }
  }, [countdown]);

  // THUẬT TOÁN CHỤP: Chỉ tính toán cắt bớt hai bên trái/phải, giữ nguyên chiều cao gốc
  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Lấy chính xác kích thước hiển thị thực tế của khung video trên giao diện
      const displayWidth = video.clientWidth;
      const displayHeight = video.clientHeight;

      // Nhân đôi kích thước canvas để ảnh chụp sắc nét hơn
      canvas.width = displayWidth * 2;
      canvas.height = displayHeight * 2;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Hiệu ứng lật gương ngang
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;

        // Giữ nguyên chiều cao gốc của camera (không cắt trên dưới)
        const sHeight = sourceHeight;
        
        // Tính toán độ rộng mới dựa theo tỷ lệ khung hiển thị để chỉ cắt 2 bên
        const displayAspect = displayWidth / displayHeight;
        const sWidth = sHeight * displayAspect;
        
        // Tọa độ X bắt đầu cắt ở chính giữa để loại bỏ đều hai bên rìa trái và phải
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

  if (!isClient) return null;

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${bgImages[session]})` }}
    >
      <div className="absolute inset-0 bg-black/20 z-0" />
  
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative z-5 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000 mt-[50vh] w-full max-w-xl h-72 mx-4 bg-transparent border-none outline-none cursor-pointer group select-none"
        > 
          <p className="mt-6 text-white/30 tracking-[0.5em] uppercase text-xs font-light group-hover:text-white/70 transition-colors duration-500 animate-pulse text-center">
            Chạm vào mặt nước
          </p>
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
                    <div className="text-4xl mb-3 transform group-hover:scale-125 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse">
                      ✨
                    </div>
                    <span className="text-white/40 tracking-[0.2em] uppercase text-[11px] font-light group-hover:text-white/80 transition-colors duration-300">
                      Chạm để soi gương thần
                    </span>
                  </button>
                )}

            {/* LÚC CHUẨN BỊ CHỤP (watching) */}
            {status === 'watching' && (
              <div className="relative w-full h-full animate-in fade-in duration-1000 flex items-center justify-center bg-black/20 p-6 md:p-10">
                
                {/* BẰNG CÁCH GIỚI HẠN max-w-[50%] HOẶC max-w-md:
                  Khung video sẽ thu hẹp chiều ngang lại tạo thành một chiếc gương đứng nghệ thuật.
                  Sử dụng object-cover giúp camera tự động xén bớt 2 bên rìa ngay lúc này, giữ nguyên chiều cao. 
                  Nhờ vậy, lúc chuẩn bị bấm máy bạn thấy ai trong khung hình đứng này thì ảnh ra sẽ chuẩn xác 100% y hệt.
                */}
                <div className="w-full md:w-[50%] h-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover opacity-85 scale-x-[-1] filter blur-[0.5px]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 via-transparent to-transparent mix-blend-color pointer-events-none" />
                  
                  {countdown !== null && countdown > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px] z-20 animate-in fade-in duration-300">
                      <span className="text-7xl md:text-8xl font-extralight text-white/90 tracking-widest drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-ping absolute">
                        {countdown}
                      </span>
                      <span className="text-7xl md:text-8xl font-extralight text-white/90 tracking-widest drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                        {countdown}
                      </span>
                    </div>
                  )}
                </div>

                <p className="absolute bottom-12 w-full text-center text-blue-200/80 text-sm italic tracking-widest animate-pulse z-10 pointer-events-none">
                  Mặt hồ đang lưu lại bóng hình yên bình của bạn...
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

      <button 
        onClick={() => router.push('/homepage')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full border border-white/20 transition-all group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        <span className="font-medium text-sm">Rời khỏi hồ nước</span>
      </button>
    </div>
  );
};

export default HoNuocPage;