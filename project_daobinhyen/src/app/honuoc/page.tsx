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

  const fallbackMessages = [
    "Nhìn sâu vào mặt hồ, bạn có nhìn thấy một tâm hồn đã đi qua biết bao ghềnh thác nhưng chưa một lần bỏ cuộc? Những vết hằn tháng năm không làm bạn bớt lấp lánh, chúng là minh chứng cho sự kiên cường của riêng bạn. Hãy để làn nước mát dịu này ôm lấy toàn bộ sự mỏi mệt, xoa dịu đi những lo toan mà bạn đang gồng gánh trên vai suốt thời gian qua. Bạn xứng đáng được yêu thương, được trân trọng, và hơn hết, xứng đáng có một khoảng lặng bình yên ngay lúc này.",
    "Mặt hồ yên ả dịu dàng như chính bản chất con người bạn khi trút bỏ đi những áp lực của thế giới ngoài kia. Đừng vội vã, hãy hít một hơi thật sâu. Thế giới có thể đòi hỏi bạn phải hoàn hảo, nhưng nơi đây chỉ cần bạn là chính mình – nguyên bản, chân thật và tràn đầy giá trị. Ngày hôm nay, dù có điều gì xảy ra, hãy mỉm cười với bóng hình phản chiếu trong nước, bởi vì tồn tại của bạn đã là một điều vô cùng kỳ diệu rồi."
  ];

  useEffect(() => {
    setIsClient(true);
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
      return () => clearInterval(timer);  
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

  // THUẬT TOÁN CHỤP: Chỉ xén bớt hai bên trái/phải, giữ nguyên chiều cao gốc
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

  if (!isClient) return null;

  return (
    <main 
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${bgImages[session]})` }}
    >
      <div className="absolute inset-0 bg-black/20 z-0" />
  
      {!isOpen && (
        <div className="relative z-5 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000 mt-[55vh]"> 
          <button 
            onClick={() => setIsOpen(true)}
            className="w-32 h-32 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-5xl hover:scale-110 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.2)]"
          >
            💧
          </button>
          <p className="mt-6 text-white/50 tracking-[0.5em] uppercase text-xs font-light animate-pulse text-center