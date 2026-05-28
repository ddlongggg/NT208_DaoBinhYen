'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function ProfileBar() {
    const pathname = usePathname() || '';
    const { user: firebaseUser, userDataExtended } = useAuthContext();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [localData, setLocalData] = useState<any>(null); // State dự phòng

    // 1. CHỜ NEXT.JS RENDER XONG
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. TỰ ĐỘNG LẤY DATA DỰ PHÒNG NẾU CONTEXT BỊ SẬP
    // Chạy song song không cần chờ FirebaseUser để chống lỗi rơi trạng thái
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/user/getUserInFo');
                if (res.ok) {
                    const data = await res.json();
                    setLocalData(data);
                }
            } catch (error) {
                console.error("Lỗi gọi API tại ProfileBar:", error);
            }
        };
        // Luôn gọi thử 1 lần để chắc chắn 100% có data
        if (!userDataExtended) {
            fetchUserData();
        }
    }, [userDataExtended]);

    if (!mounted) return null;

    // 3. BLACKLIST CHẶN TRANG HỆ THỐNG
    const path = pathname.toLowerCase();
    if (path === '/' || path.includes('/login') || path.includes('/register') || path.includes('/forgot-password')) {
        return null;
    }

    // 🔥 4. GỘP DỮ LIỆU THÔNG MINH
    // Lấy dữ liệu từ Context, nếu Context bị lỗi thì xài dữ liệu API dự phòng
    const activeData = userDataExtended?.data || userDataExtended || localData?.data || localData;

    // NẾU VẪN ĐANG TRỐNG DỮ LIỆU THÌ HIỆN BẢNG LOADING (KHÔNG ĐƯỢC PHÉP BIẾN MẤT)
    if (!activeData) {
        return (
            <div style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 999999, pointerEvents: 'none' }}>
                <div className="flex items-center gap-2 p-2 px-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                    <span className="w-4 h-4 rounded-full border-2 border-pink-400 border-t-transparent animate-spin"></span>
                    <span className="text-white text-xs font-bold animate-pulse">Đang nạp hồ sơ...</span>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // DỮ LIỆU ĐÃ SẴN SÀNG -> HIỂN THỊ GIAO DIỆN CHÍNH THỨC
    // ----------------------------------------------------------------------
    const userPoints = Number(activeData.lastSurveyScore ?? 0);
    const userName = activeData.username || 'Lữ Khách';
    const userAvatar = firebaseUser?.photoURL || '/logo.png'; // Dùng dấu ? an toàn
    const moneyCount = Number(activeData.money ?? 0);
    const seedCount = Number(activeData.seeds ?? 0);

    const essences = {
        lam: Number(activeData.essence_lam ?? 0),
        tim: Number(activeData.essence_tim ?? 0),
        vang: Number(activeData.essence_vang ?? 0),
        cam: Number(activeData.essence_cam ?? 0),
    };

    const calculateLevel = (pts: number) => Math.floor(pts / 10) + 1;
    const calculateEmotion = (pts: number) => {
        if (pts < 10) return 'Vực Thẳm Tâm Linh';
        if (pts < 20) return 'Sương Mù Uất Nghẹn';
        if (pts < 30) return 'Tro Tàn Lặng Lẽ';
        if (pts < 40) return 'Chênh Vênh Độc Hành';
        if (pts < 50) return 'Tĩnh Lặng Thấu Suốt';
        if (pts < 60) return 'Tia Sáng Khởi Nguyên';
        if (pts < 70) return 'Vườn Hoa Chớm Nở';
        if (pts < 80) return 'Rạng Rỡ Ánh Dương';
        if (pts < 90) return 'Thăng Hoa Thuần Khiết';
        return 'Đại Ngộ Thiên Đường';
    };

    const emotionMessages: Record<string, string> = {
        'Vực Thẳm Tâm Linh': 'Trạng thái cảm xúc tồi tệ nhất, có lẽ bạn đang gặp phải rất nhiều vấn đề trong cuộc sống.',
        'Sương Mù Uất Nghẹn': 'Lòng đầy tâm sự và sự lạc lõng, hãy cho phép bản thân nghỉ ngơi một chút.',
        'Tro Tàn Lặng Lẽ': 'Sức cùng lực kiệt, nhưng sâu trong tro tàn vẫn còn mầm sống chờ đợi.',
        'Chênh Vênh Độc Hành': 'Bước chân đơn độc đôi khi mỏi mệt, nhưng đó là lúc bạn tìm thấy chính mình.',
        'Tĩnh Lặng Thấu Suốt': 'Tâm trí bắt đầu lặng sóng, bạn đã đủ bình tĩnh để nhìn thấu mọi chuyện.',
        'Tia Sáng Khởi Nguyên': 'Hy vọng đã nhen nhóm, một khởi đầu mới đang chờ đợi bạn phía trước.',
        'Vườn Hoa Chớm Nở': 'Niềm vui đang lan tỏa, hãy tận hưởng những điều nhỏ bé tuyệt vời này.',
        'Rạng Rỡ Ánh Dương': 'Hạnh phúc tràn đầy, bạn đang là nguồn năng lượng ấm áp cho mọi người.',
        'Thăng Hoa Thuần Khiết': 'Cảm xúc viên mãn, không gì có thể làm lay chuyển sự an yên trong bạn.',
        'Đại Ngộ Thiên Đường': 'Trạng thái hạnh phúc tối thượng, bạn đã thực sự tìm thấy thiên đường của riêng mình.'
    };

    return (
        // 🔥 Gắn chết inline-style zIndex: 999999 để đảm bảo không bị bất kỳ trang nào đè lên
        <div style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 999999 }} className="flex flex-row items-center gap-3 select-none pointer-events-auto">

            {/* KHỐI PROFILE BAR */}
            <div className="flex flex-col items-start relative">
                <div
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="group relative flex items-center gap-3 p-1.5 pr-5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg cursor-pointer hover:bg-white/10 transition-all duration-300"
                >
                    <div className="relative w-9 h-9 rounded-full border-2 border-pink-400 overflow-hidden shrink-0 shadow-[0_0_8px_rgba(244,114,182,0.4)] transition-transform group-hover:scale-105">
                        <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-white text-xs font-black uppercase tracking-wider drop-shadow-md">{userName}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]"></span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-300 text-[9px] font-bold uppercase opacity-75">{calculateEmotion(userPoints)}</span>
                            <div className="flex items-center gap-1 bg-yellow-500/20 px-1.5 py-0.5 rounded-md border border-yellow-500/20">
                                <span className="text-yellow-400 text-[9px] font-black">{moneyCount.toLocaleString()} 💰</span>
                                <span className="text-green-400 text-[9px] font-black ml-1">{seedCount} 🌱</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BẢNG ĐỔ XUỐNG KHI CLICK */}
                {isProfileOpen && (
                    <>
                        <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)} />

                        {/* 🔥 THÊM LẠI "absolute top-[115%] left-0" VÀO DÒNG DƯỚI ĐÂY 🔥 */}
                        <div className="absolute top-[115%] left-0 w-72 p-6 rounded-[2rem] bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">

                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div className="w-20 h-20 rounded-3xl border-2 border-white/10 p-1 bg-gradient-to-b from-white/10 to-transparent">
                                        <img src={userAvatar} className="w-full h-full rounded-2xl object-cover shadow-2xl" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">LV.{calculateLevel(userPoints)}</div>
                                </div>
                                <h2 className="text-white font-black text-xl tracking-tight uppercase">{userName}</h2>
                                <p className="text-pink-400 text-[10px] font-bold mb-4 uppercase tracking-tighter italic px-2">
                                    "{emotionMessages[calculateEmotion(userPoints)] || "Cư dân Đảo Bình Yên"}"
                                </p>

                                <div className="grid grid-cols-2 gap-2 w-full mb-5">
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10 shadow-inner text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Chỉ số</p>
                                        <p className="text-blue-400 text-[13px] font-bold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{userPoints} ĐIỂM</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10 shadow-inner text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Trạng thái</p>
                                        <p className="text-purple-400 text-[13px] font-bold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{calculateEmotion(userPoints)}</p>
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all uppercase">Nhật Ký Hành Trình</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* KHU VỰC CÁC Ô PHA LÊ TINH HOA */}
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all cursor-default group">
                    <img src="/vuonhoa/tinhhoa/tinhhoalam.png" className="w-6 h-6 rounded-full object-cover shadow-[0_0_6px_rgba(96,165,250,0.5)] group-hover:scale-110 transition-transform" alt="Lam" />
                    <span className="text-blue-400 font-black text-xs min-w-[10px] text-center">{essences.lam}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all cursor-default group">
                    <img src="/vuonhoa/tinhhoa/tinhhoatim.png" className="w-6 h-6 rounded-full object-cover shadow-[0_0_6px_rgba(192,132,252,0.5)] group-hover:scale-110 transition-transform" alt="Tím" />
                    <span className="text-purple-400 font-black text-xs min-w-[10px] text-center">{essences.tim}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all cursor-default group">
                    <img src="/vuonhoa/tinhhoa/tinhhoavang.png" className="w-6 h-6 rounded-full object-cover shadow-[0_0_6px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform" alt="Vàng" />
                    <span className="text-yellow-400 font-black text-xs min-w-[10px] text-center">{essences.vang}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-all cursor-default group">
                    <img src="/vuonhoa/tinhhoa/tinhhoacam.png" className="w-6 h-6 rounded-full object-cover shadow-[0_0_6px_rgba(251,146,60,0.5)] group-hover:scale-110 transition-transform" alt="Cam" />
                    <span className="text-orange-400 font-black text-xs min-w-[10px] text-center">{essences.cam}</span>
                </div>
            </div>
        </div>
    );
}