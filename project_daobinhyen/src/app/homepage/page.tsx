'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfile {
    name: string;
    points: number;
    emotion: string;
    gold: number;
    level: number;
}

interface Letter {
    id: string;
    content: string;
    is_read: boolean;
    status: string;
}

export default function DynamicIsland() {

    const router = useRouter();
    const [bgImage, setBgImage] = useState<string>('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userEmotion, setUserEmotion] = useState('Hạnh phúc');
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);
    const [username, setUsername] = useState('Lữ Khách');
    const [unreadLetters, setUnreadLetters] = useState<Letter[]>([]);
    const [showMailNotice, setShowMailNotice] = useState(false);
    const [userData, setUserData] = useState({
        username: 'Đang tải...',
        lastSurveyScore: 0,
        money: 0,
        seeds: 0,
        avatar: 'logo.png'
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/user/getUserInFo');
                if (res.ok) {
                    const data = await res.json();

                    // Đồng bộ cả username cũ lẫn cụm dữ liệu mới
                    if (data.username) setUsername(data.username);

                    setUserData({
                        username: data.username || 'Lữ Khách',
                        lastSurveyScore: Number(data.lastSurveyScore ?? 0),
                        money: Number(data.money ?? 0),
                        seeds: Number(data.seeds ?? 0),
                        avatar: 'logo.png' // Hoặc data.avatar nếu sau này bạn bổ sung vào Firebase
                    });

                    // Tự động tính toán cảm xúc dựa trên lastSurveyScore vừa lấy về
                    setUserEmotion(calculateEmotion(Number(data.lastSurveyScore ?? 0)));
                }
            } catch (error) {
                console.error("Lỗi gọi API profile:", error);
            }
        };

        fetchUserData();
    }, []);

    const getDismissedMailIds = () => {
        try {
            return JSON.parse(sessionStorage.getItem('homepage_mail_notice_dismissed_ids') || '[]') as string[];
        } catch {
            return [];
        }
    };

    const dismissCurrentMailNotice = () => {
        const dismissedIds = new Set(getDismissedMailIds());
        unreadLetters.forEach(letter => dismissedIds.add(letter.id));
        sessionStorage.setItem('homepage_mail_notice_dismissed_ids', JSON.stringify([...dismissedIds]));
    };

    useEffect(() => {
        const fetchUnreadLetters = async () => {
            try {
                const res = await fetch('/api/user/mailbox/inbox');
                if (!res.ok) return;

                const dismissedIds = new Set(getDismissedMailIds());
                const data = await res.json();
                const unread = (data.letters || []).filter((letter: Letter) =>
                    letter.status === 'delivered' && !letter.is_read && !dismissedIds.has(letter.id)
                );

                setUnreadLetters(unread);
                setShowMailNotice(unread.length > 0);
            } catch (error) {
                console.error('Loi kiem tra thu tren homepage:', error);
            }
        };

        fetchUnreadLetters();
        const interval = window.setInterval(fetchUnreadLetters, 10000);
        return () => window.clearInterval(interval);
    }, []);

    const handleDismissMailNotice = () => {
        dismissCurrentMailNotice();
        setShowMailNotice(false);
    };

    const handleOpenMailNotice = () => {
        dismissCurrentMailNotice();
        router.push('/thanthu?mailbox=inbox');
    };

    // --- CHI TIẾT THÊM MỚI: State quản lý bảng thông tin ---
    const [selectedZone, setSelectedZone] = useState<{ title: string, path: string, desc: string, img: string } | null>(null);


    // --- PHẦN MỚI: Quản lý dữ liệu người dùng ---

    // Hàm tính Level từ Points (Ví dụ: mỗi 100 điểm lên 1 level)
    const calculateLevel = (pts: number) => Math.floor(pts / 10) + 1;

    // Hàm tính Emotion từ Points
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
        return 'Đại Ngộ Thiên Đường'; // Trên 900 điểm
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

    // Dữ liệu bổ sung cho các bảng hiện lên
    const zonesInfo: Record<string, any> = {
        "/haidang": { title: "Tháp Canh Minh Triết", desc: "Nơi lưu giữ những bí mật cổ xưa của hòn đảo.", img: "HaiDangg.png" },
        "/thanthu": { title: "Cây Thần Thụ", desc: "Trái tim của đảo, nơi nguồn năng lượng sống dồi dào.", img: "TrungTamDao.png" },
        "/nhago": { title: "Nhà Gỗ Bình Yên", desc: "Không gian mộc mạc lắng nghe tiếng nhạc dịu êm giúp con người chìm giấc ngủ.", img: "/wooden-house/midday.png" },
        "/suoinguon": { title: "Suối Nguồn Cảm Xúc", desc: "Dòng suối nguồn kỳ diệu gột rửa muộn phiền.", img: "/backgroundsuoinguon/SuoiNguonCamXuc12AM.png" },
        "/vuonhoa": { title: "Vườn Tâm Hồn", desc: "Mỗi bông hoa đại diện cho một kỷ niệm đẹp.", img: "/vuonhoa/VuonHoa.png" },
        "/vachda": { title: "Vách Đá Tầm Nhìn", desc: "Nơi cao nhất để phóng tầm mắt ra đại dương.", img: "/island/Island10AM.jpg" },
        "/honuoc": { title: "Hồ Nước Soi Bóng", desc: "Nơi mặt hồ phẳng lặng lắng nghe những xao động và ôm lấy cảm xúc thật của bạn.", img: "HoNuoc.png" }
    };

    const handleZoneClick = (e: React.MouseEvent, path: string) => {
        e.preventDefault(); // Chặn việc chuyển trang ngay lập tức của thẻ Link
        setSelectedZone({ ...zonesInfo[path], path }); // Mở bảng thông tin
    };
    // -------------------------------------------------------

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

    useEffect(() => {
        const fetchTimeAndSetImage = async () => {
            try {
                const res = await fetch('/api/auth/time');
                const data = await res.json();
                if (data.hour !== undefined) {
                    const newImage = getBackgroundImage(data.hour);
                    setBgImage(newImage);
                }
            } catch (error) {
                console.error("Lỗi lấy thời gian:", error);
                setBgImage('/island/Island0PM.jpg');
            }
        };

        fetchTimeAndSetImage();
        const interval = setInterval(fetchTimeAndSetImage, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!bgImage) {
        return <div className="bg-black w-screen h-screen" />;
    }


    return (
        <main className="relative w-screen h-screen flex flex-col overflow-hidden bg-black">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap');
                .font-classic-serif {
                    font-family: 'Merriweather', Georgia, serif !important;
                }
                @keyframes floatingBg {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-floating {
                    animation: floatingBg 6s ease-in-out infinite;
                }
            `}</style>

            {/* NÚT BÁNH RĂNG CÀI ĐẶT */}
            <div
                className="absolute -left-[0%] -top-[5%] w-[100%] h-[115%] animate-floating transition-all duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url('${bgImage}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                }}
            >

                {/* VÙNG 1: Ngọn Hải Đăng */}
                <Link
                    href="/haidang"
                    onClick={(e) => handleZoneClick(e, "/haidang")}
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{ top: '35%', left: '65%', width: '4%', height: '17%' }}
                >
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">Tháp Canh Minh Triết</h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md italic">Bấm để xem chi tiết</p>
                    </div>
                </Link>

                {/* VÙNG 2: Cây Thần Thụ */}
                <Link
                    href="/thanthu"
                    onClick={(e) => handleZoneClick(e, "/thanthu")}
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{ top: '48%', left: '45%', width: '9%', height: '20%' }}
                >
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">Cây Thần Thụ</h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md italic">Bấm để xem chi tiết</p>
                    </div>
                </Link>

                {/* VÙNG 3: Nhà gỗ */}
                <Link
                    href="/nhago"
                    onClick={(e) => handleZoneClick(e, "/nhago")}
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{ top: '53%', left: '55%', width: '5%', height: '7%' }}
                >
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">Nhà Gỗ Bình Yên</h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md italic">Bấm để xem chi tiết</p>
                    </div>
                </Link>

                {/* VÙNG 4: Suối nguồn */}
                <Link
                    href="/suoinguon"
                    onClick={(e) => handleZoneClick(e, "/suoinguon")}
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{ top: '43%', left: '35%', width: '11%', height: '12%' }}
                >
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">Suối Nguồn Cảm Xúc</h3>
                        <div className="w-8 h-[2px] bg-white mb-2 rounded-full shadow-[0_0_5px_white]"></div>
                        <p className="text-gray-100 text-xs md:text-sm font-medium drop-shadow-md italic">Bấm để xem chi tiết</p>
                    </div>
                </Link>

                {/* VÙNG 5: Vườn hoa */}
                <div className="absolute inset-0 pointer-events-none z-30">
                    <Link
                        href="/vuonhoa"
                        onClick={(e) => handleZoneClick(e, "/vuonhoa")}
                        onMouseEnter={() => setHoveredZone('garden')}
                        onMouseLeave={() => setHoveredZone(null)}
                        className="absolute cursor-pointer pointer-events-auto flex items-center justify-center bg-transparent"
                        style={{ top: '66%', left: '35%', width: '35%', height: '30%', clipPath: 'polygon(0% 15%, 15% 40%, 40% 45%, 50% 45%, 60% 47%, 65% 48%, 68% 48%, 70% 30%, 70% 35%, 60% 30%, 50% 35%, 40% 32%, 30% 28%, 20% 28%, 10% 15%)' }}
                    />
                    <div className={`absolute pointer-events-none transition-all duration-300 flex flex-col items-center ${hoveredZone === 'garden' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ top: '70%', left: '48%', transform: 'translateX(-50%)' }}>
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl w-56 text-center">
                            <h3 className="text-white font-bold text-lg mb-1">Vườn Tâm Hồn</h3>
                            <p className="text-gray-100 text-xs italic">Bấm để xem chi tiết</p>
                        </div>
                    </div>
                </div>

                {/* VÙNG 6: Vách đá */}
                <Link
                    href="/vachda"
                    onClick={(e) => handleZoneClick(e, "/vachda")}
                    className="absolute z-20 cursor-pointer rounded-xl flex items-center justify-center group"
                    style={{ top: '41.5%', left: '47%', width: '7%', height: '4%' }}
                >
                    <div className="absolute w-48 md:w-56 p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none flex flex-col items-center text-center">
                        <h3 className="text-white font-bold text-base md:text-lg mb-1 drop-shadow-md">Vách Đá Tầm Nhìn</h3>
                        <p className="text-gray-100 text-[10px] italic">Bấm để xem chi tiết</p>
                    </div>
                </Link>

                {/* VÙNG 7: Hồ nước */}
                <div className="absolute inset-0 pointer-events-none z-30">
                    <Link
                        href="/honuoc"
                        onClick={(e) => handleZoneClick(e, "/honuoc")}
                        onMouseEnter={() => setHoveredZone('honuoc')}
                        onMouseLeave={() => setHoveredZone(null)}
                        className="absolute cursor-pointer pointer-events-auto flex items-center justify-center bg-transparent transition-all duration-500"
                        style={{ top: '57%', left: '41%', width: '19%', height: '17%', clipPath: 'polygon(0% 0%,5% 5%, 8% 7%, 20% 17%, 0% 46%, 0% 65%, 11% 63%, 12% 66%, 0% 70%, 6% 100%, 80% 100%, 85% 88%, 76% 83%, 84% 77%, 90% 81%, 96.5% 72%, 97% 45%, 70% 25%, 62% 18%, 51% 25%, 52% 38%, 67% 50%, 57% 68%,37% 62%, 27% 52%, 38% 40%, 41.5% 42%, 43% 36%, 43% 25%, 24% 12%, 24% 0%)' }}
                    />
                    <div className={`absolute pointer-events-none transition-all duration-300 flex flex-col items-center ${hoveredZone === 'honuoc' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ top: '60%', left: '50%', transform: 'translateX(-50%)' }}>
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl w-56 text-center text-white font-bold">Hồ Nước Soi Bóng</div>
                    </div>
                </div>
            </div>

            {/* --- PHẦN SỬA ĐỔI: BẢNG MODAL TRONG SUỐT --- */}
            {selectedZone && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center animate-in fade-in duration-300">
                    {/* Lớp nền overlay mờ nhẹ để vẫn thấy đảo */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setSelectedZone(null)} />

                    <div className="relative bg-black/60 backdrop-blur-2xl border border-white/20 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto md:h-[350px] animate-in zoom-in-95 duration-300 mx-4">
                        <div className="w-full md:w-1/2 h-48 md:h-full relative overflow-hidden">
                            <img src={selectedZone.img} className="w-full h-full object-cover" alt={selectedZone.title} />
                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                        </div>
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{selectedZone.title}</h2>
                                <div className="w-10 h-1 bg-pink-500 rounded-full mb-4" />
                                <p className="text-gray-300 text-sm italic leading-relaxed">"{selectedZone.desc}"</p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setSelectedZone(null)} className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 text-[10px] font-black uppercase hover:bg-white/10 transition-all">Quay lại</button>
                                <button onClick={() => router.push(selectedZone.path)} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-700 text-white text-[10px] font-black uppercase shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity">Đi Đến</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMailNotice && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={handleDismissMailNotice} />
                    <div
                        className="font-classic-serif relative w-full max-w-md rounded-xl border-[4px] border-[#d2c4a7] bg-[#fdfbf7] p-7 text-[#4a4036] shadow-2xl"
                        style={{ backgroundImage: 'radial-gradient(#e6dcc6 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    >
                        <div className="absolute left-5 top-5 flex h-16 w-12 -rotate-3 flex-col items-center justify-center border-2 border-dashed border-[#d2c4a7] bg-[#fdfbf7] p-1 opacity-75">
                            <span className="text-xl">💌</span>
                            <span className="font-classic-serif text-[7px] font-bold uppercase leading-tight text-[#8c7d6c]">Thư đến</span>
                        </div>

                        <div className="mb-6 mt-2 flex flex-col items-center text-center">
                            <h2 className="mb-2 font-classic-serif text-2xl font-black uppercase tracking-widest text-[#4a4036]">
                                Có thư mới
                            </h2>
                            <div className="mb-3 h-1 w-24 rounded-full bg-[#8c7d6c]/45" />
                            <p className="px-4 font-classic-serif text-sm italic leading-relaxed text-[#8c7d6c]">
                                Hòm thư tương lai của bạn có {unreadLetters.length} lá thư đã đến lúc mở.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={handleDismissMailNotice}
                                className="flex-1 rounded-lg border border-[#d2c4a7] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#8c7d6c] shadow-sm transition hover:bg-[#f4ecd8]"
                            >
                                Bỏ qua
                            </button>
                            <button
                                onClick={handleOpenMailNotice}
                                className="flex-1 rounded-lg bg-[#8c7d6c] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#fdfbf7] shadow-[0_4px_14px_0_rgba(140,125,108,0.39)] transition hover:bg-[#766859]"
                            >
                                Mở thư
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none"></div>
        </main>
    );
}
