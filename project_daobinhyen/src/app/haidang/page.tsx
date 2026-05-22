'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LighthouseModalContainer, { ModalTab } from './components/modals/LighthouseModalContainer';
import DongHoModalContainer from './components/modals/DongHoTapTrung/DongHoModalContainer';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import RadioModalContainer from './components/modals/RadioChuaLanh/RadioModalContainer';
import GioiThieuModalContainer from './components/modals/GioiThieuModalContainer';
import { useAudioStore } from '@/app/api/user/lighthouse/store/useAudioStore';
import { GENRES } from '@/app/api/user/lighthouse/data/radioData';

export default function HaiDang() {
    const [floor, setFloor] = useState<1 | 2>(1);
    const [currentHour, setCurrentHour] = useState<number | null>(null); // Null initially for hydration safety
    const [transitionDuration, setTransitionDuration] = useState<'duration-0' | 'duration-[2000ms]'>('duration-0');

    // Modal Controller States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<ModalTab>('hai-do');
    const [isDongHoOpen, setIsDongHoOpen] = useState(false);
    const [isRadioOpen, setIsRadioOpen] = useState(false);
    const [isGioiThieuOpen, setIsGioiThieuOpen] = useState(false);

    // Audio Store
    const { currentGenre } = useAudioStore();
    const genreDef = currentGenre ? GENRES.find(g => g.id === currentGenre) : null;

    const openModal = (tab: ModalTab) => {
        setActiveModalTab(tab);
        setIsModalOpen(true);
    };

    const fetchTime = async () => {
        try {
            const res = await fetch('/api/auth/time');
            const data = await res.json();
            if (data.hour !== undefined) {
                setCurrentHour(data.hour);
            }
        } catch (error) {
            console.error("Lỗi lấy thời gian:", error);
            // If API fails, keep current time or use local time
            setCurrentHour(new Date().getHours());
        }
    };

    useEffect(() => {
        // Set local hour immediately on client side to avoid waiting for fetch
        const localHour = new Date().getHours();
        setCurrentHour(localHour);

        fetchTime();

        // Allow initial mount to render instantly, then enable 2-second transitions
        const timeout = setTimeout(() => {
            setTransitionDuration('duration-[2000ms]');
        }, 100);

        const interval = setInterval(fetchTime, 60000); // Update every minute
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    // Get time stage based on hour
    const getTimeStage = (h: number | null) => {
        if (h === null) return 'noon'; // Default to noon during hydration/initial load
        if (h >= 4 && h < 6) return 'dawn'; // LHDawn.png
        if (h >= 6 && h < 11) return 'morning'; // LHMorning.png
        if (h >= 11 && h < 14) return 'noon'; // LHNoon.png
        if (h >= 14 && h < 18) return 'afternoon'; // LHAfternoon.png
        return 'night'; // LHNight.png
    };

    const timeStage = getTimeStage(currentHour);

    const backgrounds = {
        dawn: '/Lighthouse/LHDawn.png',
        morning: '/Lighthouse/LHMorning.png',
        noon: '/Lighthouse/LHNoon.png',
        afternoon: '/Lighthouse/LHAfternoon.png',
        night: '/Lighthouse/LHNight.png'
    };

    return (
        <main className="relative w-screen h-screen flex flex-col overflow-hidden bg-black text-white">
            <GlobalAudioPlayer floor={floor} />

            {/* --- LỚP NỀN (BACKGROUND LAYERS) --- */}
            {/* Tầng 1: Luôn giữ nguyên, fade out khi lên Tầng 2 */}
            <div
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out z-10 ${floor === 1 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                style={{
                    backgroundImage: `url('/Lighthouse/LHGroundFloor.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* --- CÁC VÙNG CLICK CỦA TẦNG 1 --- */}

                {/* 5. Hải đồ tương lai (Nằm bao trọn mặt bàn) */}
                <div
                    onClick={() => openModal('hai-do')}
                    className="absolute cursor-pointer group z-10"
                    style={{ top: '65%', left: '20%', width: '60%', height: '30%' }}
                >
                    <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Hải đồ tương lai</h3>
                    </div>
                </div>

                {/* 1. Nhật ký neo đậu (Cuốn sách) */}
                <div
                    onClick={() => openModal('nhat-ky')}
                    className="absolute cursor-pointer group z-20"
                    style={{ top: '75%', left: '58%', width: '12%', height: '12%' }}
                >
                    <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Nhật ký neo đậu</h3>
                    </div>
                </div>

                {/* 2. La bàn tiến độ */}
                <div
                    onClick={() => openModal('la-ban')}
                    className="absolute cursor-pointer group z-20"
                    style={{ top: '74%', left: '44.5%', width: '10%', height: '10%' }}
                >
                    <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">La bàn tiến độ</h3>
                    </div>
                </div>

                {/* 3. Mẩu giấy nhỏ */}
                <div
                    onClick={() => openModal('mau-giay')}
                    className="absolute cursor-pointer group z-20"
                    style={{ top: '68%', left: '32%', width: '13%', height: '24%' }}
                >
                    <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Mẩu giấy nhỏ</h3>
                    </div>
                </div>

                {/* 4. Lối lên tháp vọng (Cầu thang) */}
                <div
                    onClick={() => setFloor(2)}
                    className="absolute cursor-pointer group z-20"
                    style={{ top: '30%', left: '80%', width: '15%', height: '50%' }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Lối lên tháp vọng</h3>
                    </div>
                </div>

                {/* 6. Giới thiệu (Các cuộn giấy đứng phía sau cạnh đống củi) */}
                <div
                    onClick={() => setIsGioiThieuOpen(true)}
                    className="absolute cursor-pointer group z-20"
                    style={{ top: '53%', left: '38%', width: '6%', height: '12%' }}
                >
                    <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Giới thiệu</h3>
                    </div>
                </div>

                {/* 7. Lối ra ngoài (Gần cầu thang, mép phải) */}
                <Link
                    href="/homepage"
                    className="absolute cursor-pointer group z-20 flex items-center justify-center"
                    style={{ top: '90%', left: '90%', width: '12%', height: '10%' }}
                >
                    <div className="absolute pointer-events-none animate-pulse">
                        <span className="text-white/60 font-semibold text-lg tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] whitespace-nowrap">LỐI RA</span>
                    </div>

                    <div className="absolute top-[-45px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Ra khỏi hải đăng</h3>
                    </div>
                </Link>
            </div>

            {/* Tầng 2: Vùng chứa 5 nền thay đổi. Fade in khi lên Tầng 2 */}
            <div className={`absolute inset-0 transition-all duration-1000 ease-in-out z-20 ${floor === 2 ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-105'}`}>
                {/* 5 Layer nền với opacity transistion ứng với timeStage nhằm chuyển mịn giữa các mốc giờ */}
                {Object.entries(backgrounds).map(([stage, src]) => (
                    <div
                        key={stage}
                        className={`absolute inset-0 transition-opacity ease-in-out ${transitionDuration} ${stage === timeStage ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            backgroundImage: `url('${src}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                ))}

                {/* --- LỚP PHỦ ÁNH SÁNG THEO NHẠC --- */}
                <div
                    className="absolute inset-0 transition-colors duration-1000 ease-in-out mix-blend-overlay pointer-events-none"
                    style={{
                        backgroundColor: genreDef ? genreDef.colorTheme : 'transparent',
                        opacity: genreDef ? 0.4 : 0
                    }}
                />

                {/* --- CÁC VÙNG CLICK CỦA TẦNG 2 --- */}

                {/* 1. Đồng hồ tập trung (Đồng hồ cát) */}
                <div
                    onClick={() => setIsDongHoOpen(true)}
                    className="absolute cursor-pointer group z-30"
                    style={{ top: '58%', left: '47%', width: '6%', height: '26%' }}
                >
                    <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Đồng hồ tập trung</h3>
                    </div>
                </div>

                {/* 2. Tần số chữa lành (Radio gỗ) */}
                <div
                    onClick={() => setIsRadioOpen(true)}
                    className="absolute cursor-pointer group z-30"
                    style={{ top: '54.5%', left: '55.5%', width: '13.5%', height: '19%' }}
                >
                    <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Tần số chữa lành</h3>
                    </div>
                </div>

                {/* 3. Lối xuống tầng 1 (Cửa nằm bên phải) */}
                <div
                    onClick={() => setFloor(1)}
                    className="absolute cursor-pointer group z-30 flex items-center justify-center"
                    style={{ top: '19%', left: '84%', width: '12%', height: '56%' }}
                >
                    <div className="absolute pointer-events-none animate-pulse">
                        <span className="text-white/60 font-semibold text-xl tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">LỐI RA</span>
                    </div>

                    <div className="absolute top-[50%] left-[-20px] -translate-x-full -translate-y-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Lối xuống tầng 1</h3>
                    </div>
                </div>

            </div>

            {/* Modal Đồng hồ Tập Trung – riêng biệt */}
            <DongHoModalContainer
                isOpen={isDongHoOpen}
                onClose={() => setIsDongHoOpen(false)}
            />

            {/* Khung Modal Container Đa Nhiệm (các tab còn lại) */}
            <LighthouseModalContainer
                isOpen={isModalOpen}
                initialTab={activeModalTab}
                onClose={() => setIsModalOpen(false)}
            />

            {/* Khung Modal Radio Chữa Lành */}
            <RadioModalContainer
                isOpen={isRadioOpen}
                onClose={() => setIsRadioOpen(false)}
            />

            {/* Modal Giới Thiệu – riêng biệt */}
            <GioiThieuModalContainer
                isOpen={isGioiThieuOpen}
                onClose={() => setIsGioiThieuOpen(false)}
            />
        </main>
    );
}
