'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { usePathname } from 'next/navigation';
import { Quicksand } from 'next/font/google';
const quicksand = Quicksand({
    subsets: ['vietnamese'],
    weight: ['400', '500', '600', '700'], // Các độ đậm nhạt
    display: 'swap',
});

// ==========================================
// TỪ ĐIỂN 30 DANH HIỆU & MÔ TẢ (RANK SYSTEM)
// ==========================================
const RANK_SYSTEM = {
    emotion: [
        { name: 'Vực Thẳm Tâm Linh', desc: 'Trạng thái tồi tệ nhất, có lẽ bạn đang gặp phải rất nhiều vấn đề tiêu cực trong cuộc sống.' },
        { name: 'Sương Mù Uất Nghẹn', desc: 'Lạc lối trong buồn bã và khó tìm thấy lối thoát, hãy cho phép bản thân nghỉ ngơi.' },
        { name: 'Tro Tàn Lặng Lẽ', desc: 'Sự kiệt sức vì mệt mỏi, nhưng sâu bên trong vẫn chực chờ một mầm sống hy vọng.' },
        { name: 'Chênh Vênh Độc Hành', desc: 'Cảm giác chông chênh, tự ôm lấy nỗi cô đơn vô hình.' },
        { name: 'Tĩnh Lặng Thấu Suốt', desc: 'Tâm trí bắt đầu lặng sóng, bạn đã đủ bình tĩnh để chấp nhận và nhìn thấu mọi chuyện.' },
        { name: 'Tia Sáng Khởi Nguyên', desc: 'Hy vọng nhen nhóm, bắt đầu cảm nhận lại được những niềm vui nhỏ bé.' },
        { name: 'Vườn Hoa Chớm Nở', desc: 'Biết yêu thương bản thân hơn, cảm xúc tươi mới và tích cực đang lan tỏa.' },
        { name: 'Rạng Rỡ Ánh Dương', desc: 'Lạc quan, vui vẻ, bạn đang là nguồn năng lượng ấm áp cho mọi người xung quanh.' },
        { name: 'Thăng Hoa Thuần Khiết', desc: 'Tự tại và bình yên, trân trọng từng khoảnh khắc tuyệt diệu ở hiện tại.' },
        { name: 'Đại Ngộ Thiên Đường', desc: 'Trạng thái viên mãn tối thượng, trái tim hoàn toàn tự do và hạnh phúc.' }
    ],
    sleep: [
        { name: 'Đêm Đen Mất Ngủ', desc: 'Trằn trọc, thao thức liên miên, tâm trí không ngừng suy nghĩ.' },
        { name: 'Mộng Mị Bất An', desc: 'Ngủ không sâu giấc, thường xuyên tỉnh dậy với cảm giác mệt nhoài.' },
        { name: 'Dư Âm Mệt Mỏi', desc: 'Có chợp mắt được đôi chút nhưng thức dậy cơ thể vẫn nặng trĩu.' },
        { name: 'Chập Chờn Giữa Đêm', desc: 'Giấc ngủ chắp vá, dễ bị đánh thức bởi bất kỳ tiếng động nhỏ nào.' },
        { name: 'Bến Đỗ Nghỉ Ngơi', desc: 'Bắt đầu thư giãn được một chút, giấc ngủ tương đối yên bình hơn.' },
        { name: 'Giấc Mơ Lặng Gió', desc: 'Cơ thể được thả lỏng, bước vào giấc ngủ êm ái và ít trằn trọc.' },
        { name: 'Màn Đêm Dịu Êm', desc: 'Ngủ sâu giấc, thức dậy với tinh thần sảng khoái và dễ chịu.' },
        { name: 'Suối Nguồn Tái Tạo', desc: 'Giấc ngủ chất lượng cao, phục hồi năng lượng mạnh mẽ cho cơ thể.' },
        { name: 'Tinh Tú Ru Miên', desc: 'Chìm vào giấc ngủ ngọt ngào, cảm giác như được các vì sao ôm ấp vỗ về.' },
        { name: 'An Nhiên Mộng Cảnh', desc: 'Giấc ngủ hoàn hảo, tĩnh lặng tuyệt đối, cơ thể tràn đầy sinh khí khi bình minh.' }
    ],
    study: [
        { name: 'Lạc Lối Trì Hoãn', desc: 'Mất tập trung hoàn toàn, không thể tìm thấy động lực để bắt đầu công việc.' },
        { name: 'Tâm Trí Mù Sương', desc: 'Đọc trước quên sau, cảm thấy rất khó khăn để tiếp thu kiến thức mới.' },
        { name: 'Bước Chân Nặng Trĩu', desc: 'Miễn cưỡng làm việc, tiến độ chậm chạp và dễ sinh ra chán nản.' },
        { name: 'Nỗ Lực Chênh Vênh', desc: 'Có cố gắng nhưng cực kỳ dễ bị xao nhãng bởi môi trường xung quanh.' },
        { name: 'Bắt Nhịp Cuồng Quay', desc: 'Bắt đầu lấy lại được sự tập trung, hoàn thành được những đầu việc cơ bản.' },
        { name: 'Guồng Máy Trơn Tru', desc: 'Làm việc đều đặn, duy trì được kỷ luật và tiến độ khá tốt.' },
        { name: 'Mạch Nguồn Cảm Hứng', desc: 'Tiếp thu nhanh, có hứng thú mạnh mẽ với việc học tập và nghiên cứu.' },
        { name: 'Trí Tuệ Sáng Suốt', desc: 'Suy nghĩ logic, giải quyết bài vở và vấn đề cực kỳ sắc bén, hiệu quả.' },
        { name: 'Say Mê Bất Tận', desc: 'Hoàn toàn chìm đắm vào công việc, năng suất đạt mức cực cao.' },
        { name: 'Tinh Hoa Hội Tụ', desc: 'Nắm bắt mọi kiến thức tinh túy nhất, học tập và làm việc với phong độ đỉnh cao tuyệt đối.' }
    ]
};

export default function ProfileBar() {
    const pathname = usePathname() || '';
    const { user: firebaseUser, userDataExtended } = useAuthContext();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [localData, setLocalData] = useState<any>(null);

    const [isPointsLogOpen, setIsPointsLogOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        fetchUserData();
    }, [pathname]);

    if (!mounted) return null;

    const path = pathname.toLowerCase();
    if (path === '/' || path.includes('/login') || path.includes('/register') || path.includes('/forgot-password') || path.includes('/reset-password') || path.includes('/survey') || path.includes('/daily-checkin')) {
        return null;
    }

    const activeData = localData?.data || localData || userDataExtended?.data || userDataExtended;

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

    // LẤY DỮ LIỆU TỪ FIREBASE
    const userPoints = Number(activeData.lastSurveyScore ?? 0);
    const surveyType = activeData.lastSurveyType || 'emotion'; // Mặc định là cảm xúc nếu chưa có dữ liệu

    const userName = activeData.username || 'Lữ Khách';
    const userAvatar = firebaseUser?.photoURL || '/logo.png';
    const moneyCount = Number(activeData.money ?? 0);
    const seedCount = Number(activeData.seeds ?? 0);
    const leavesCount = Number(activeData.leaves ?? 0);

    // 🔥 KIỂM TRA STRICT XEM CÓ LÀ NULL/UNDEFINED HAY KHÔNG ĐỂ KHÔNG BỊ ÉP VỀ 0
    const surveyStudy = activeData.survey_study !== null && activeData.survey_study !== undefined ? Number(activeData.survey_study) : null;
    const surveyEmotion = activeData.survey_emotion !== null && activeData.survey_emotion !== undefined ? Number(activeData.survey_emotion) : null;
    const surveySleep = activeData.survey_sleep !== null && activeData.survey_sleep !== undefined ? Number(activeData.survey_sleep) : null;

    const essences = {
        lam: Number(activeData.essence_lam ?? 0),
        tim: Number(activeData.essence_tim ?? 0),
        vang: Number(activeData.essence_vang ?? 0),
        cam: Number(activeData.essence_cam ?? 0),
    };

    const calculateLevel = (pts: number) => Math.floor(pts / 10);

    const getRankInfo = (pts: number, type: string) => {
        let levelIndex = Math.floor(pts / 10);
        if (levelIndex >= 10) levelIndex = 9;
        if (levelIndex < 0) levelIndex = 0;

        const typeData = RANK_SYSTEM[type as keyof typeof RANK_SYSTEM] || RANK_SYSTEM.emotion;

        return typeData[levelIndex];
    };

    const currentRank = getRankInfo(userPoints, surveyType);

    const getRankColor = (type: string) => {
        if (type === 'study') return 'text-green-300';
        if (type === 'sleep') return 'text-blue-300';
        return 'text-pink-300';
    }

    return (
        <div style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 999999 }} className={`flex flex-row items-center gap-3 select-none pointer-events-auto ${quicksand.className}`}>

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
                            <span className={`${getRankColor(surveyType)} text-[9px] font-bold uppercase opacity-90 drop-shadow-md`}>
                                {currentRank.name}
                            </span>
                            <div className="flex items-center gap-1 bg-yellow-500/20 px-1.5 py-0.5 rounded-md border border-yellow-500/20">
                                <span className="text-yellow-400 text-[9px] font-black">{moneyCount.toLocaleString()} 💰</span>
                                <span className="text-green-400 text-[9px] font-black ml-1">{seedCount} 🌱</span>
                                <span className="text-green-400 text-[9px] font-black ml-1">{leavesCount} 🍃</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BẢNG ĐỔ XUỐNG KHI CLICK */}
                {isProfileOpen && (
                    <>
                        <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)} />

                        <div className="absolute top-[115%] left-0 w-72 p-6 rounded-[2rem] bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">

                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div className="w-20 h-20 rounded-3xl border-2 border-white/10 p-1 bg-gradient-to-b from-white/10 to-transparent">
                                        <img src={userAvatar} className="w-full h-full rounded-2xl object-cover shadow-2xl" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">LV.{calculateLevel(userPoints)}</div>
                                </div>
                                <h2 className="text-white font-black text-xl tracking-tight uppercase">{userName}</h2>
                                <p className="text-gray-300 text-[10px] font-bold mb-4 tracking-tighter italic px-2 leading-relaxed">
                                    "{currentRank.desc}"
                                </p>

                                <div className="grid grid-cols-2 gap-2 w-full mb-5">
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10 shadow-inner text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Chỉ số</p>
                                        <p className="text-blue-400 text-[13px] font-bold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{userPoints} ĐIỂM</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10 shadow-inner text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Danh hiệu</p>
                                        <p className={`${getRankColor(surveyType)} text-[12px] font-bold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}>{currentRank.name}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        setIsPointsLogOpen(true);
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all uppercase"
                                >
                                    Nhật Ký Kho Điểm
                                </button>
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

            {/* POPUP: NHẬT KÝ KHO ĐIỂM */}
            {isPointsLogOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[9999999] pointer-events-auto">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPointsLogOpen(false)}></div>

                    <div className="relative w-[340px] bg-[#1a1a1a]/95 backdrop-blur-2xl border-2 border-white/20 rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setIsPointsLogOpen(false)}
                            className="absolute top-4 right-5 text-gray-400 hover:text-white font-black text-lg transition-colors"
                        >
                            ✕
                        </button>

                        <h3 className="text-center font-black text-xl mb-6 uppercase tracking-widest bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            Nhật Ký Kho Điểm
                        </h3>

                        <div className="flex flex-col gap-3">
                            {/* Ô Cảm xúc */}
                            <div className="flex justify-between items-center bg-gradient-to-r from-pink-500/10 to-transparent p-4 rounded-2xl border border-pink-500/20 hover:bg-pink-500/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl drop-shadow-md">💖</span>
                                    <div className="flex flex-col">
                                        <span className="text-pink-300 font-bold text-sm uppercase tracking-wider">Cảm Xúc</span>
                                        <span className="text-gray-400 text-[9px] truncate w-[130px]">
                                            {surveyEmotion !== null ? getRankInfo(surveyEmotion, 'emotion').name : 'Chưa có dữ liệu'}
                                        </span>
                                    </div>
                                </div>
                                {surveyEmotion !== null ? (
                                    <span className="text-white font-black text-xl">{surveyEmotion} <span className="text-xs text-gray-400 font-medium">điểm</span></span>
                                ) : (
                                    <span className="text-gray-400 font-bold text-[11px] italic pr-1">Chưa khảo sát</span>
                                )}
                            </div>

                            {/* Ô Giấc ngủ */}
                            <div className="flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-transparent p-4 rounded-2xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl drop-shadow-md">🌙</span>
                                    <div className="flex flex-col">
                                        <span className="text-blue-300 font-bold text-sm uppercase tracking-wider">Giấc Ngủ</span>
                                        <span className="text-gray-400 text-[9px] truncate w-[130px]">
                                            {surveySleep !== null ? getRankInfo(surveySleep, 'sleep').name : 'Chưa có dữ liệu'}
                                        </span>
                                    </div>
                                </div>
                                {surveySleep !== null ? (
                                    <span className="text-white font-black text-xl">{surveySleep} <span className="text-xs text-gray-400 font-medium">điểm</span></span>
                                ) : (
                                    <span className="text-gray-400 font-bold text-[11px] italic pr-1">Chưa khảo sát</span>
                                )}
                            </div>

                            {/* Ô Học tập */}
                            <div className="flex justify-between items-center bg-gradient-to-r from-green-500/10 to-transparent p-4 rounded-2xl border border-green-500/20 hover:bg-green-500/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl drop-shadow-md">📚</span>
                                    <div className="flex flex-col">
                                        <span className="text-green-300 font-bold text-sm uppercase tracking-wider">Học Tập</span>
                                        <span className="text-gray-400 text-[9px] truncate w-[130px]">
                                            {surveyStudy !== null ? getRankInfo(surveyStudy, 'study').name : 'Chưa có dữ liệu'}
                                        </span>
                                    </div>
                                </div>
                                {surveyStudy !== null ? (
                                    <span className="text-white font-black text-xl">{surveyStudy} <span className="text-xs text-gray-400 font-medium">điểm</span></span>
                                ) : (
                                    <span className="text-gray-400 font-bold text-[11px] italic pr-1">Chưa khảo sát</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}