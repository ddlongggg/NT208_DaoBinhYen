'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DynamicIsland() {
    const [bgImage, setBgImage] = useState('/island/Island0PM.jpg');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userEmotion, setUserEmotion] = useState('Hạnh phúc');

    const getBackgroundImage = (hour: number) => {
        if (hour >= 0 && hour < 2) return '/island/Island0AM.jpg';
        if (hour >= 2 && hour < 4) return '/island/Island2AM.jpg';
        if (hour >= 4 && hour < 6) return '/island/Island4AM.jpg';
        if (hour >= 6 && hour < 8) return '/island/Island6AM.jpg';
        if (hour >= 8 && hour < 10) return '/island/Island8AM.jpg';
        if (hour >= 10 && hour < 12) return '/island/Island10AM.jpg';
        if (hour >= 12 && hour < 14) return '/island/Island12AM.jpg';
        if (hour >= 14 && hour < 16) return '/island/Island2PM.jpg';
        if (hour >= 16 && hour < 17) return '/island/Island4PM.jpg';
        if (hour >= 17 && hour < 18) return '/island/Island5PM.jpg';
        if (hour >= 18 && hour < 20) return '/island/Island6PM.jpg';
        if (hour >= 20 && hour < 22) return '/island/Island8PM.jpg';
        if (hour >= 22 && hour <= 23) return '/island/Island10PM.jpg';
        return '/island/Island0PM.jpg';
    };
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);
    useEffect(() => {
        const fetchTimeAndSetImage = async () => {
            try {
                const res = await fetch('/api/auth/time');
                const data = await res.json();
                if (data.hour !== undefined) setBgImage(getBackgroundImage(data.hour));
            } catch (error) {
                console.error("Lỗi lấy thời gian:", error);
            }
        };

        fetchTimeAndSetImage();
        const interval = setInterval(fetchTimeAndSetImage, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="relative w-screen h-screen flex flex-col overflow-hidden bg-black">
            <style>{`
                @keyframes floatingBg {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-floating {
                    animation: floatingBg 6s ease-in-out infinite;
                }
            `}</style>

            <div
                className="absolute -left-[0%] -top-[5%] w-[100%] h-[115%] animate-floating transition-all duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url('${bgImage}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="absolute top-18 left-6 z-[100] flex flex-col items-start gap-3">

                    {/* Thanh hiển thị nhanh (Mini Bar) */}
                    <div
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-2 pr-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg cursor-pointer hover:bg-white/20 transition-all duration-300 group"
                    >
                        {/* Avatar với hiệu ứng viền theo cảm xúc */}
                        <div className="relative w-10 h-10 rounded-full border-2 border-pink-400 overflow-hidden shrink-0 shadow-[0_0_10px_rgba(244,114,182,0.5)] group-hover:scale-105 transition-transform">
                            <img
                                src="logo.png"
                                alt="User"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Thông tin nhanh */}
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-bold leading-tight shadow-black drop-shadow-md">
                                Luân Ngu
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                                <span className="text-gray-200 text-[11px] font-medium uppercase tracking-wider">
                                    {userEmotion}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bảng thông tin chi tiết (Hiện ra khi Click) */}
                    {isProfileOpen && (
                        <>
                            {/* Lớp phủ để click ra ngoài thì đóng */}
                            <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)} />

                            <div className="w-72 p-6 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-full border-2 border-white/30 p-1 mb-3">
                                        <img src="/path-to-avatar.jpg" className="w-full h-full rounded-full object-cover" />
                                    </div>

                                    <h2 className="text-white font-bold text-xl mb-1">Lữ Khách Phương Xa</h2>
                                    <p className="text-gray-400 text-xs mb-4 italic">"Mỗi ngày là một cuộc thám hiểm mới"</p>

                                    <div className="w-full space-y-2 text-left">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-gray-400 text-[10px] uppercase font-bold">Trạng thái tâm hồn</p>
                                            <p className="text-pink-300 text-sm font-semibold">Đang tìm kiếm sự bình yên</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-gray-400 text-[10px] uppercase font-bold">Vị trí hiện tại</p>
                                            <p className="text-white text-sm font-semibold">Đảo Bình Yên</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                                <p className="text-white font-bold">12</p>
                                                <p className="text-gray-400 text-[10px]">Kỷ niệm</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                                <p className="text-white font-bold">85%</p>
                                                <p className="text-gray-400 text-[10px]">Năng lượng</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="mt-5 w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                                        NHẬT KÝ HÀNH TRÌNH
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {/* VÙNG 1: Ngọn Hải Đăng */}
                <Link
                    href="/haidang"
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{
                        top: '35%',
                        left: '65%',
                        width: '4%',
                        height: '17%',
                        // border: '2px solid red' // Mở ra để xem vùng trỏ chuột
                    }}
                >
                    {/* BẢNG THÔNG TIN (Sẽ ẩn đi, chỉ hiện khi Hover) */}
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">
                            Tháp Canh Minh Triết
                        </h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md">
                            Đây là mô tả, chưa nghĩ ra
                        </p>
                    </div>
                </Link>

                {/* VÙNG 2: Cây Thần Thụ */}
                <Link
                    href="/thanthu"
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{
                        top: '48%',
                        left: '45%',
                        width: '9%',
                        height: '20%',
                    }}
                >
                    {/* BẢNG THÔNG TIN */}
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">
                            Cây Thần Thụ
                        </h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md">
                            Đây là mô tả, chưa nghĩ ra
                        </p>
                    </div>
                </Link>

                {/* VÙNG 3: Nhà gỗ bình yên */}
                <Link
                    href="/nhago"
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{
                        top: '53%',
                        left: '55%',
                        width: '5%',
                        height: '7%',
                    }}
                >
                    {/* BẢNG THÔNG TIN */}
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">
                            Nhà Gỗ Bình Yên
                        </h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md">
                            Đây là mô tả, chưa nghĩ ra
                        </p>
                    </div>
                </Link>
                {/* VÙNG 4: Hang và Suối Nguồn*/}
                <Link
                    href="/hangdong"
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{
                        top: '43%',
                        left: '35%',
                        width: '11%',
                        height: '12%',
                    }}
                >
                    {/* BẢNG THÔNG TIN */}
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">
                            Động Chữa Lành
                        </h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md">
                            Đây là mô tả, chưa nghĩ ra
                        </p>
                    </div>
                </Link>
                {/* VÙNG 5: Khu vườn*/}
                <div className="absolute inset-0 pointer-events-none z-30">
                    <Link
                        href="/vuonhoa"
                        onMouseEnter={() => setHoveredZone('garden')}
                        onMouseLeave={() => setHoveredZone(null)}
                        // Xóa sạch các class bg-... và hover:bg-...
                        className="absolute cursor-pointer pointer-events-auto flex items-center justify-center bg-transparent"
                        style={{
                            top: '66%',
                            left: '35%',
                            width: '35%',
                            height: '30%',
                            // Giữ nguyên clipPath để giới hạn vùng bấm chính xác theo hình dáng vườn hoa
                            clipPath: 'polygon(0% 15%, 15% 40%, 40% 45%, 50% 45%, 60% 47%, 65% 48%, 68% 48%, 70% 30%, 70% 35%, 60% 30%, 50% 35%, 40% 32%, 30% 28%, 20% 28%, 10% 15%)',
                        }}
                    >
                        {/* Vùng này giờ hoàn toàn trong suốt, người dùng không thấy gì cho đến khi trỏ chuột vào */}
                    </Link>

                    {/* BẢNG THÔNG TIN (Hiện lên khi hover vào vùng tàng hình trên) */}
                    <div
                        className={`absolute pointer-events-none transition-all duration-300 flex flex-col items-center
            ${hoveredZone === 'garden' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                        style={{
                            top: '70%', // Chỉnh bảng cao hơn vùng click một chút cho đẹp
                            left: '48%',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl w-56 text-center">
                            <h3 className="text-white font-bold text-lg mb-1 drop-shadow-md">
                                Vườn Tâm Hồn
                            </h3>
                            <div className="w-8 h-[2px] bg-pink-400 mx-auto mb-2 rounded-full shadow-[0_0_5px_rgba(244,114,182,0.8)]"></div>
                            <p className="text-gray-100 text-xs font-medium">
                                Đây là mô tả, chưa nghĩ ra
                            </p>
                        </div>

                    </div>
                </div>
                {/* VÙNG 6: Vách đá*/}
                <Link
                    href="/vachda"
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{
                        top: '41.5%',
                        left: '47%',
                        width: '7%',
                        height: '4%',
                    }}
                >
                    {/* BẢNG THÔNG TIN */}
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">
                            Vách Đá Tầm Nhìn
                        </h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md">
                            Đây là mô tả, chưa nghĩ ra
                        </p>
                    </div>
                </Link>
                {/* VÙNG 7: Hồ nước soi bóng*/}
                <div className="absolute inset-0 pointer-events-none z-30">
                    <Link
                        href="/honuoc"
                        onMouseEnter={() => setHoveredZone('honuoc')}
                        onMouseLeave={() => setHoveredZone(null)}
                        className={`
            absolute cursor-pointer pointer-events-auto flex items-center justify-center 
            transition-all duration-500 ease-in-out
            /* Thêm hiệu ứng màu ở đây */
          
        `}
                        style={{
                            top: '57%',
                            left: '41%',
                            width: '19%',
                            height: '17%',
                            clipPath: 'polygon(0% 0%,5% 5%, 8% 7%, 20% 17%, 0% 46%, 0% 65%, 11% 63%, 12% 66%, 0% 70%, 6% 100%, 80% 100%, 85% 88%, 76% 83%, 84% 77%, 90% 81%, 96.5% 72%, 97% 45%, 70% 25%, 62% 18%, 51% 25%, 52% 38%, 67% 50%, 57% 68%,37% 62%, 27% 52%, 38% 40%, 41.5% 42%, 43% 36%, 43% 25%, 24% 12%, 24% 0%)',

                        }}
                    >
                        {/* Nếu muốn có hiệu ứng viền sáng chạy quanh clip-path, 
            ta có thể thêm một div con với animation ở đây */}

                    </Link>

                    {/* BẢNG THÔNG TIN */}
                    <div
                        className={`absolute pointer-events-none transition-all duration-300 flex flex-col items-center
            ${hoveredZone === 'honuoc' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{
                            top: '60%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl w-56 text-center">
                            <h3 className="text-white font-bold text-lg mb-1 drop-shadow-md">
                                Hồ Nước Soi Bóng
                            </h3>
                            <div className="w-8 h-[2px] bg-pink-400 mx-auto mb-2 rounded-full shadow-[0_0_5px_rgba(244,114,182,0.8)]"></div>
                            <p className="text-gray-100 text-xs font-medium">
                                Đây là mô tả, chưa nghĩ ra
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none"></div>
        </main>
    );
}