'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function WeatherOverlay() {
    const pathname = usePathname() || '';
    const { userDataExtended } = useAuthContext();
    const [localData, setLocalData] = useState<any>(null);

    // Khởi tạo biến lưu trữ Audio
    const rainAudioRef = useRef<HTMLAudioElement>(null);
    const thunderAudioRef = useRef<HTMLAudioElement>(null);

    // Lấy dữ liệu user
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/user/getUserInFo');
                if (res.ok) setLocalData(await res.json());
            } catch (error) { }
        };
        fetchUserData();
    }, [userDataExtended]);

    const path = pathname.toLowerCase();

    // 1. BLACKLIST: KHÔNG HIỂN THỊ CẢ HÌNH LẪN TIẾNG Ở CÁC TRANG HỆ THỐNG
    if (
        path === '/' ||
        path.includes('/login') ||
        path.includes('/register') ||
        path.includes('/forgot-password') ||
        path.includes('/reset-password') ||
        path.includes('/survey') ||
        path.includes('/daily-checkin')
    ) {
        return null;
    }

    // 2. NHỮNG TRANG TRONG NHÀ: CHỈ PHÁT TIẾNG, TẮT HÌNH ẢNH MƯA/SẤM CHỚP
    const isIndoor = path.includes('/thucung') || path.includes('/nhago') || path.includes('/haidang');

    const activeData = localData?.data || localData || userDataExtended?.data || userDataExtended;
    if (!activeData) return null;

    let currentPoints = activeData.lastSurveyScore;
    if (currentPoints === null || currentPoints === undefined) currentPoints = 50;

    let level = Math.floor(Number(currentPoints) / 10) + 1;
    if (level > 10) level = 10;
    if (level < 1) level = 1;

    let overlayClass = '';
    let backdropFilter = '';
    let showRain = false;
    let showHeavyRain = false;
    let showLightning = false;
    let showMist = false;
    let sunRays = false;

    // CẤU HÌNH THỜI TIẾT THEO LEVEL
    switch (level) {
        case 1:
            overlayClass = 'bg-slate-900/70 mix-blend-multiply';
            backdropFilter = 'backdrop-grayscale-[0.8] backdrop-contrast-125';
            showHeavyRain = true; showLightning = true; showMist = true;
            break;
        case 2:
            overlayClass = 'bg-slate-800/60 mix-blend-multiply';
            backdropFilter = 'backdrop-grayscale-[0.6]';
            showHeavyRain = true; showLightning = true; showMist = true;
            break;
        case 3:
            overlayClass = 'bg-slate-700/50 mix-blend-multiply';
            backdropFilter = 'backdrop-grayscale-[0.4]';
            showRain = true; showMist = true;
            break;
        case 4:
            overlayClass = 'bg-slate-600/30 mix-blend-multiply';
            backdropFilter = 'backdrop-grayscale-[0.2]';
            showRain = true;
            break;
        case 5:
            overlayClass = 'bg-slate-500/20 mix-blend-multiply';
            backdropFilter = 'backdrop-contrast-90';
            break;
        case 6:
            overlayClass = 'bg-transparent';
            backdropFilter = '';
            break;
        case 7:
            overlayClass = 'bg-amber-200/10 mix-blend-overlay';
            backdropFilter = 'backdrop-saturate-110';
            break;
        case 8:
            overlayClass = 'bg-yellow-300/20 mix-blend-overlay';
            backdropFilter = 'backdrop-saturate-125 backdrop-brightness-105';
            break;
        case 9:
            overlayClass = 'bg-orange-400/20 mix-blend-overlay';
            backdropFilter = 'backdrop-saturate-150 backdrop-brightness-110';
            sunRays = true;
            break;
        case 10:
            overlayClass = 'bg-yellow-400/30 mix-blend-color-dodge';
            backdropFilter = 'backdrop-saturate-200 backdrop-brightness-115';
            sunRays = true;
            break;
    }

    // 🔥 XỬ LÝ ÂM THANH THỜI TIẾT 🔥
    useEffect(() => {
        const rainAudio = rainAudioRef.current;
        const thunderAudio = thunderAudioRef.current;
        if (!rainAudio || !thunderAudio) return;

        // Lấy âm lượng từ cài đặt hệ thống của bạn
        const getGlobalVol = () => {
            if (localStorage.getItem('app_muted') === 'true') return 0;
            return Number(localStorage.getItem('app_volume') ?? '70') / 100;
        };

        const vol = getGlobalVol();

        // Phát tiếng mưa
        if (showRain || showHeavyRain) {
            rainAudio.volume = showHeavyRain ? vol * 0.8 : vol * 0.3; // Mưa to thì tiếng lớn hơn
            rainAudio.play().catch(() => console.log("Cần click chuột vào web để trình duyệt cho phép phát âm thanh"));
        } else {
            rainAudio.pause();
        }

        // Phát tiếng sấm chớp (Lặp lại ngẫu nhiên)
        let thunderTimer: NodeJS.Timeout;
        if (showLightning) {
            const playThunder = () => {
                thunderAudio.volume = vol * 0.9;
                thunderAudio.currentTime = 0;
                thunderAudio.play().catch(() => { });
                // Sấm nổ ngẫu nhiên mỗi 6 đến 12 giây
                thunderTimer = setTimeout(playThunder, Math.random() * 6000 + 6000);
            };
            playThunder();
        }

        return () => {
            clearTimeout(thunderTimer);
        };
    }, [showRain, showHeavyRain, showLightning, pathname]);

    return (
        <>
            {/* THẺ AUDIO (Chạy ngầm) */}
            <audio ref={rainAudioRef} src="/audio/tiengmuaroi.mp3" loop />
            <audio ref={thunderAudioRef} src="/audio/tiengsamchop.mp3" />

            {/* NẾU Ở TRONG NHÀ -> CHỈ NGHE TIẾNG. NẾU Ở NGOÀI TRỜI -> HIỆN GIAO DIỆN HÌNH ẢNH */}
            {!isIndoor && (
                <div className="fixed inset-0 pointer-events-none z-[5000] overflow-hidden">
                    <div className={`absolute inset-0 transition-all duration-[3000ms] ${overlayClass} ${backdropFilter}`}></div>

                    {(showRain || showHeavyRain) && (
                        <div className="absolute -inset-[50%] rain-container">
                            <div className="rain-bg"></div>
                            <div className="rain-md"></div>
                            {showHeavyRain && <div className="rain-fg"></div>}
                        </div>
                    )}

                    {showMist && (
                        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-slate-200/20 via-slate-400/5 to-transparent mix-blend-screen opacity-70 animate-pulse-slow"></div>
                    )}

                    {showLightning && (
                        <div className="absolute inset-0 w-full h-full weather-lightning mix-blend-color-dodge"></div>
                    )}

                    {sunRays && (
                        <div className="absolute inset-0 w-full h-full sun-rays mix-blend-overlay opacity-60"></div>
                    )}

                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .rain-container {
                            transform: rotate(10deg) scale(1.3);
                        }
                        
                        .rain-bg, .rain-md, .rain-fg {
                            position: absolute;
                            inset: 0;
                            width: 100%;
                            height: 100%;
                        }

                        /* 🔥 ĐÃ ĐỔI THÀNH HẠT NƯỚC: Thay vì đường gạch thẳng, giờ dùng hình Elip (Oval) để tạo độ bầu bĩnh như giọt nước rơi 🔥 */
                        
                        /* LỚP XA: Hạt sương nhỏ xíu (bầu bĩnh) */
                        .rain-bg {
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cg fill='white' fill-opacity='0.4'%3E%3Cellipse cx='50' cy='20' rx='1.5' ry='3'/%3E%3Cellipse cx='150' cy='80' rx='1.5' ry='3'/%3E%3Cellipse cx='250' cy='30' rx='1.5' ry='3'/%3E%3Cellipse cx='350' cy='120' rx='1.5' ry='3'/%3E%3Cellipse cx='20' cy='200' rx='1.5' ry='3'/%3E%3Cellipse cx='120' cy='280' rx='1.5' ry='3'/%3E%3Cellipse cx='220' cy='190' rx='1.5' ry='3'/%3E%3Cellipse cx='320' cy='310' rx='1.5' ry='3'/%3E%3Cellipse cx='80' cy='350' rx='1.5' ry='3'/%3E%3Cellipse cx='180' cy='380' rx='1.5' ry='3'/%3E%3Cellipse cx='280' cy='360' rx='1.5' ry='3'/%3E%3Cellipse cx='380' cy='390' rx='1.5' ry='3'/%3E%3C/g%3E%3C/svg%3E");
                            background-size: 400px 400px;
                            animation: rain-fall 1.8s linear infinite; 
                        }

                        /* LỚP GIỮA: Giọt nước kích thước vừa */
                        .rain-md {
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Cg fill='white' fill-opacity='0.5'%3E%3Cellipse cx='30' cy='40' rx='2' ry='4.5'/%3E%3Cellipse cx='130' cy='90' rx='2' ry='4.5'/%3E%3Cellipse cx='230' cy='10' rx='2' ry='4.5'/%3E%3Cellipse cx='80' cy='180' rx='2' ry='4.5'/%3E%3Cellipse cx='180' cy='220' rx='2' ry='4.5'/%3E%3Cellipse cx='270' cy='160' rx='2' ry='4.5'/%3E%3Cellipse cx='50' cy='260' rx='2' ry='4.5'/%3E%3Cellipse cx='150' cy='290' rx='2' ry='4.5'/%3E%3Cellipse cx='250' cy='270' rx='2' ry='4.5'/%3E%3C/g%3E%3C/svg%3E");
                            background-size: 300px 300px;
                            animation: rain-fall 1.2s linear infinite; 
                        }

                        /* LỚP GẦN: Hạt nước to, bóng bẩy bay lướt qua mắt */
                        .rain-fg {
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cg fill='white' fill-opacity='0.6'%3E%3Cellipse cx='40' cy='20' rx='3' ry='7'/%3E%3Cellipse cx='140' cy='80' rx='3' ry='7'/%3E%3Cellipse cx='90' cy='140' rx='3' ry='7'/%3E%3Cellipse cx='180' cy='160' rx='3' ry='7'/%3E%3Cellipse cx='10' cy='180' rx='3' ry='7'/%3E%3C/g%3E%3C/svg%3E");
                            background-size: 200px 200px;
                            animation: rain-fall 0.7s linear infinite; 
                            filter: blur(0.5px); /* Chỉnh mờ nhẹ để tạo khối 3D cho nước */
                        }

                        @keyframes rain-fall {
                            0% { background-position: 0px 0px; }
                            100% { background-position: 0px 1200px; }
                        }

                        @keyframes pulse-slow {
                            0%, 100% { opacity: 0.6; transform: scaleY(1); }
                            50% { opacity: 0.8; transform: scaleY(1.05); }
                        }
                        .animate-pulse-slow {
                            animation: pulse-slow 6s ease-in-out infinite;
                        }

                        .weather-lightning {
                            background-color: rgba(224, 242, 254, 0.8);
                            opacity: 0;
                            animation: lightning-flash 8s infinite;
                        }
                        @keyframes lightning-flash {
                            0%, 95%, 100% { opacity: 0; }
                            96% { opacity: 0.7; }
                            97% { opacity: 0; }
                            98% { opacity: 0.4; }
                            99% { opacity: 0; }
                        }

                        .sun-rays {
                            background: repeating-linear-gradient(
                                45deg,
                                rgba(255, 223, 112, 0.15) 0%,
                                rgba(255, 223, 112, 0) 10%,
                                rgba(255, 223, 112, 0.25) 20%
                            );
                            animation: sun-move 15s linear infinite alternate;
                        }
                        @keyframes sun-move {
                            0% { transform: scale(1.1) translateX(-2%); }
                            100% { transform: scale(1.3) translateX(2%); }
                        }
                    `}} />
                </div>
            )}
        </>
    );
}