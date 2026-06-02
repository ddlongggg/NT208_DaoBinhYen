'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SettingsButton from '@/app/components/SettingsButton';

interface Letter {
    id: string;
    content: string;
    sent_at: string;
    deliver_at: string;
    is_read: boolean;
    status: string;
}

interface Particle {
    id: number;
    type: 'leaf' | 'coin' | 'seed';
    x: number;
    emoji: string;
    duration: number;
    delay: number;
    swing: number;
}

interface CustomAlert {
    isOpen: boolean;
    message: string;
    title?: string;
    type?: 'info' | 'confirm';
    onConfirm?: () => void;
}

export default function TrungTamDao() {
    const searchParams = useSearchParams();
    const mailboxMode = searchParams.get('mailbox');
    const [bgImage, setBgImage] = useState<string>('');
    const [isMailboxModalOpen, setIsMailboxModalOpen] = useState(false);
    const [mailTab, setMailTab] = useState<'write' | 'inbox'>('write');
    const [, setShakeCount] = useState(0);
    const [mailContent, setMailContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isTreeHovered, setIsTreeHovered] = useState(false);
    const [isMailboxHovered, setIsMailboxHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [letters, setLetters] = useState<Letter[]>([]);
    const [isLoadingInbox, setIsLoadingInbox] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isShaking, setIsShaking] = useState(false);

    const [customAlert, setCustomAlert] = useState<CustomAlert>({
        isOpen: false,
        message: '',
        title: 'Bưu cục Tương Lai',
        type: 'info'
    });

    const showAlert = (message: string, title: string = 'Bưu cục Tương Lai') => {
        setCustomAlert({ isOpen: true, message, title, type: 'info' });
    };

    const showConfirm = (message: string, title: string, onConfirm: () => void) => {
        setCustomAlert({
            isOpen: true,
            message,
            title,
            type: 'confirm',
            onConfirm
        });
    };

    const getBackgroundImage = (hour: number) => {
        if (hour >= 5 && hour < 6) return '/binhminhtrungtamdao.png';
        if (hour >= 16 && hour < 18) return '/hoanghontrungtamdao.png';
        if (hour >= 18 && hour < 22) return '/buoitoitrungtamdao.png';
        if (hour >= 22 || hour < 5) return '/buoikhuyatrungtamdao.png';
        return '/TrungTamDao.png';
    };

    useEffect(() => {
        const fetchTimeAndSetImage = async () => {
            try {
                const res = await fetch(`/api/auth/time?t=${new Date().getTime()}`);
                const data = await res.json();
                if (data.hour !== undefined) {
                    setBgImage(getBackgroundImage(data.hour));
                } else {
                    setBgImage(getBackgroundImage(new Date().getHours()));
                }
            } catch {
                setBgImage(getBackgroundImage(new Date().getHours()));
            }
        };

        fetchTimeAndSetImage();
        const interval = setInterval(fetchTimeAndSetImage, 60000);
        return () => clearInterval(interval);
    }, []);

    const spawnParticles = useCallback((type: 'leaf' | 'coin' | 'seed') => {
        const count = type === 'leaf' ? 8 : type === 'coin' ? 5 : 4;
        const leafEmojis = ['🍂', '🍃', '🌿', '🍀'];
        const coinEmojis = ['🪙', '💰', '✨'];
        const seedEmojis = ['🌱', '🌾', '✨', '🫘'];

        const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            type,
            x: 20 + Math.random() * 60,
            emoji: type === 'leaf'
                ? leafEmojis[Math.floor(Math.random() * leafEmojis.length)]
                : type === 'coin'
                    ? coinEmojis[Math.floor(Math.random() * coinEmojis.length)]
                    : seedEmojis[Math.floor(Math.random() * seedEmojis.length)],
            duration: 1.5 + Math.random() * 1.5,
            delay: Math.random() * 0.4,
            swing: (Math.random() - 0.5) * 120,
        }));

        setParticles(prev => [...prev, ...newParticles]);

        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
        }, 4000);
    }, []);

    const handleShake = async () => {
        if (isShaking) return;
        setIsShaking(true);

        let type: 'leaf' | 'coin' | 'seed' = 'leaf';
        let amount = 0;

        try {
            // 🔥 Lưu thẳng vào Firebase bằng API Route bạn đã tạo trước đó
            const res = await fetch('/api/user/leaves/shake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (res.status === 429) {
                const seconds = Math.ceil((data.retryAfterMs || 1000) / 1000);
                showAlert(`Cây thần thụ cần nghỉ thêm ${seconds} giây nữa rồi hãy rung tiếp nhé.`, 'Thu Hoạch Thần Thụ');
                return;
            }

            if (res.ok && data.success && data.reward) {
                type = data.reward.type;
                amount = data.reward.amount;
                let itemName = '';

                // Định danh vật phẩm hiển thị trên thông báo
                if (type === 'leaf') {
                    itemName = 'Lá Vàng 🍂';
                } else if (type === 'coin') {
                    itemName = 'Xu Vàng 🪙';
                } else {
                    itemName = 'Hạt Giống 🌱';
                }

                setShakeCount(prev => prev + 1);
                spawnParticles(type);

                showAlert(`Cây thần thụ vừa rung rinh và đánh rơi ${amount} ${itemName}!\nTa đã cất gọn vào túi đồ cho con rồi nhé.`, 'Thu Hoạch Thần Thụ');

                // 🔥 PHÁT TÍN HIỆU CẬP NHẬT CHO PROFILE BAR TOÀN CỤC NẢY SỐ
                window.dispatchEvent(new Event('userDataUpdated'));
            }
        } catch (error) {
            console.error('Lỗi khi rung cây:', error);
            showAlert('Cây thần thụ đang nghỉ ngơi, hãy thử lại sau một lát nhé.', 'Lỗi kết nối');
        } finally {
            setTimeout(() => setIsShaking(false), 500);
        }
    };

    const fetchInbox = async () => {
        setIsLoadingInbox(true);
        try {
            const res = await fetch('/api/user/mailbox/inbox');
            if (res.ok) {
                const data = await res.json();
                setLetters(data.letters || []);
            }
        } catch (error) {
            console.error('Lỗi lấy hộp thư:', error);
        } finally {
            setIsLoadingInbox(false);
        }
    };

    const handleTabChange = (tab: 'write' | 'inbox') => {
        setMailTab(tab);
        setSelectedLetter(null);
        if (tab === 'inbox') fetchInbox();
    };

    const handleOpenMailbox = () => {
        setIsMailboxModalOpen(true);
        setMailTab('write');
        setSelectedLetter(null);
    };

    useEffect(() => {
        if (mailboxMode !== 'inbox') return;

        setIsMailboxModalOpen(true);
        setMailTab('inbox');
        setSelectedLetter(null);
        fetchInbox();
    }, [mailboxMode]);

    const handleReadLetter = async (letter: Letter) => {
        setSelectedLetter(letter);
        if (!letter.is_read) {
            try {
                await fetch('/api/user/mailbox/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ letterId: letter.id })
                });
                setLetters(prev => prev.map(l =>
                    l.id === letter.id ? { ...l, is_read: true, status: 'read' } : l
                ));
            } catch (error) {
                console.error('Lỗi đánh dấu đã đọc:', error);
            }
        }
    };

    const handleDeleteLetter = (mailId: string) => {
        showConfirm(
            'Lá thư chứa đựng kỷ niệm này sẽ biến mất vĩnh viễn khỏi hòm thư của bạn.\nBạn thực sự muốn hủy nó chứ?',
            'Hủy Bỏ Tâm Thư',
            async () => {
                try {
                    const res = await fetch('/api/user/mailbox/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mailId })
                    });
                    if (res.ok) {
                        setLetters(prev => prev.filter(l => l.id !== mailId));
                        if (selectedLetter?.id === mailId) setSelectedLetter(null);
                    }
                } catch (error) {
                    console.error('Lỗi xóa thư:', error);
                }
            }
        );
    };

    const handleSendMail = async () => {
        if (!mailContent.trim()) {
            showAlert('Vui lòng viết gì đó trước khi gửi tâm tư đi nhé!', 'Hệ thống Nhắn gửi');
            return;
        }
        setIsSending(true);
        try {
            const res = await fetch('/api/user/mailbox/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: mailContent })
            });
            const data = await res.json();
            if (data.success) {
                setMailContent('');
                setIsMailboxModalOpen(false);
                showAlert('Đã gửi thư tương lai thành công! Bưu tá sẽ mang thư tới sau 24 giờ nữa.', 'Niêm Phong Thư');
            } else {
                showAlert(data.error || 'Có lỗi bất ngờ xảy ra, hãy thử lại sau.', 'Báo lỗi');
            }
        } catch (error) {
            console.error('Lỗi gửi thư:', error);
        } finally {
            setIsSending(false);
        }
    };

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

                @keyframes fall {
                    0%   { transform: translateY(-20px) translateX(0px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) translateX(var(--swing)) rotate(720deg); opacity: 0; }
                }
                .particle {
                    position: fixed;
                    top: 10%;
                    font-size: 1.8rem;
                    pointer-events: none;
                    z-index: 9999;
                    animation: fall var(--duration) var(--delay) ease-in forwards;
                }
            `}</style>

            {particles.map(p => (
                <span
                    key={p.id}
                    className="particle"
                    style={{
                        left: `${p.x}%`,
                        '--swing': `${p.swing}px`,
                        '--duration': `${p.duration}s`,
                        '--delay': `${p.delay}s`,
                    } as React.CSSProperties}
                >
                    {p.emoji}
                </span>
            ))}

            <div
                className="absolute inset-0 w-full h-full"
                style={{
                    backgroundImage: `url('${bgImage}')`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none"></div>

                {/* Nút thoát ra homepage */}
                <Link
                    href="/homepage"
                    className="absolute cursor-pointer group z-[100] flex items-center justify-center font-sans"
                    style={{ top: '90%', left: '90%', width: '12%', height: '10%' }}
                >
                    <div className="absolute pointer-events-none animate-pulse">
                        <span className="text-white/60 font-semibold text-lg tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] whitespace-nowrap">LỐI RA</span>
                    </div>

                    <div className="absolute top-[-45px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Rời khỏi cây thần thụ</h3>
                    </div>
                </Link>

                {/* NÚT CÀI ĐẶT - luôn ở góc phải trên cùng */}
                {/* Cây Thần Thụ */}
                <div
                    onClick={handleShake}
                    onMouseEnter={() => setIsTreeHovered(true)}
                    onMouseLeave={() => setIsTreeHovered(false)}
                    onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                    className="absolute inset-0 w-full h-full cursor-pointer z-10"
                    style={{
                        clipPath: 'polygon(0.3% 0.1%, 88.6% 0.1%, 76.5% 27.8%, 43.2% 27.8%, 37.8% 52.5%, 50.1% 89.9%, 28.5% 98.2%, 9.8% 96.6%, 0.0% 82.9%, 8.4% 73.5%, 16.9% 61.4%, 17.2% 46.4%, 18.9% 38.2%, 17.4% 29.3%, 10.3% 24.6%, 9.1% 19.5%, 0.2% 16.9%, 0.0% 5.8%)'
                    }}
                />
                {isTreeHovered && (
                    <div
                        className="fixed z-[200] px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-bold border border-white/20 shadow-xl pointer-events-none whitespace-nowrap"
                        style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
                    >
                        ✨ Rung cây thần thụ
                    </div>
                )}

                {/* Hòm Thư */}
                <div
                    onClick={handleOpenMailbox}
                    onMouseEnter={() => setIsMailboxHovered(true)}
                    onMouseLeave={() => setIsMailboxHovered(false)}
                    onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                    className="absolute inset-0 w-full h-full cursor-pointer z-10"
                    style={{
                        clipPath: 'polygon(44.7% 66.6%, 44.9% 75.1%, 50.2% 79.9%, 57.9% 75.7%, 57.9% 61.7%, 56.9% 58.1%, 55.5% 56.1%, 49.1% 57.3%, 46.2% 57.8%, 45.1% 59.6%, 44.7% 62.9%)'
                    }}
                />
                {isMailboxHovered && (
                    <div
                        className="fixed z-[200] px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-bold border border-white/20 shadow-xl pointer-events-none whitespace-nowrap"
                        style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
                    >
                        💌 Hòm Thư Tương Lai
                    </div>
                )}

                {/* --- MODAL HÒM THƯ Tương Lai --- */}
                {isMailboxModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMailboxModalOpen(false)}></div>
                        <div
                            className="relative bg-[#fdfbf7] border-[4px] border-[#d2c4a7] p-8 md:p-10 rounded-xl w-[95%] max-w-2xl shadow-2xl flex flex-col mx-4 animate-in zoom-in-95 duration-500 transform origin-bottom"
                            style={{ backgroundImage: 'radial-gradient(#e6dcc6 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                        >
                            <button onClick={() => setIsMailboxModalOpen(false)} className="absolute top-4 right-4 text-[#8c7d6c] hover:text-[#4a4036] transition-colors">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <div className="absolute top-6 left-6 w-16 h-20 border-2 border-[#d2c4a7] border-dashed p-1 flex flex-col items-center justify-center opacity-70 -rotate-3 bg-[#fdfbf7]">
                                <span className="text-2xl mb-1">🕊️</span>
                                <span className="text-[8px] font-bold text-[#8c7d6c] uppercase text-center leading-tight font-classic-serif">Gửi tương lai</span>
                            </div>

                            <div className="flex flex-col items-center mb-6 mt-4">
                                <h2 className="text-3xl md:text-4xl font-black text-[#4a4036] font-classic-serif tracking-widest uppercase mb-2 text-center">Bưu thiếp Thời gian</h2>
                                <div className="w-32 h-1 bg-[#8c7d6c] rounded-full mb-3 opacity-50"></div>
                                <p className="text-[#8c7d6c] text-sm md:text-base italic font-classic-serif text-center px-4">&quot;Gói ghém tâm tư của ngày hôm nay, gửi trọn vẹn cho ngày mai...&quot;</p>
                            </div>

                            {/* Tab */}
                            <div className="flex justify-center gap-6 mb-6">
                                <button
                                    onClick={() => handleTabChange('write')}
                                    className={`pb-2 border-b-2 font-bold uppercase tracking-wider text-sm transition-colors ${mailTab === 'write' ? 'border-[#8c7d6c] text-[#4a4036]' : 'border-transparent text-[#d2c4a7] hover:text-[#8c7d6c]'}`}
                                >
                                    Viết Thư
                                </button>
                                <button
                                    onClick={() => handleTabChange('inbox')}
                                    className={`pb-2 border-b-2 font-bold uppercase tracking-wider text-sm transition-colors flex items-center gap-2 ${mailTab === 'inbox' ? 'border-[#8c7d6c] text-[#4a4036]' : 'border-transparent text-[#d2c4a7] hover:text-[#8c7d6c]'}`}
                                >
                                    Hộp Thư Đến
                                    {letters.filter(l => !l.is_read).length > 0 && (
                                        <span className="bg-red-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {letters.filter(l => !l.is_read).length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Tab: Viết Thư */}
                            {mailTab === 'write' && (
                                <>
                                    <div className="relative bg-[#fdfbf7] border border-[#d2c4a7] shadow-inner rounded-md overflow-hidden mb-8">
                                        <div
                                            className="px-6 pt-5 pb-4"
                                            style={{
                                                backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 35px, #d2c4a7 35px, #d2c4a7 36px)',
                                                backgroundPositionY: '52px',
                                            }}
                                        >
                                            <p className="text-[#8c7d6c] font-classic-serif italic mb-1 text-base h-[35px] flex items-end">Gửi tôi của ngày mai,</p>
                                            <textarea
                                                value={mailContent}
                                                onChange={(e) => setMailContent(e.target.value)}
                                                placeholder="Viết những lời bạn muốn nhắn nhủ..."
                                                rows={6}
                                                className="w-full bg-transparent focus:outline-none resize-none text-[#4a4036] font-classic-serif text-base placeholder:text-[#d2c4a7]"
                                                style={{ lineHeight: '35px' }}
                                            />
                                            <p className="text-[#8c7d6c] font-classic-serif italic text-right text-base h-[35px] flex items-center justify-end">Ký tên: _________</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
                                        <p className="text-xs text-[#8c7d6c] uppercase font-bold tracking-widest bg-[#f4ecd8] px-3 py-1 rounded-full border border-[#d2c4a7]">Thời gian nhận: 24 GIỜ SAU</p>
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsMailboxModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-[#d2c4a7] text-[#8c7d6c] font-bold hover:bg-[#f4ecd8] transition-all uppercase tracking-wide text-sm shadow-sm">Cất lại</button>
                                            <button
                                                onClick={handleSendMail}
                                                disabled={isSending}
                                                className="group relative px-8 py-2.5 bg-[#8c7d6c] text-[#fdfbf7] font-bold rounded-lg shadow-[0_4px_14px_0_rgba(140,125,108,0.39)] hover:bg-[#6c7a65] transition-all disabled:opacity-50 uppercase tracking-wide text-sm overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                                <span className="relative z-10 flex items-center gap-2">
                                                    {isSending ? 'Đang gửi...' : 'Niêm Phong'}
                                                    {!isSending && <span className="text-lg">💌</span>}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Tab: Hộp Thư Đến */}
                            {mailTab === 'inbox' && (
                                <div className="min-h-[200px]">
                                    {isLoadingInbox ? (
                                        <div className="flex items-center justify-center py-12">
                                            <span className="text-[#8c7d6c] font-classic-serif italic animate-pulse">Đang mở hòm thư...</span>
                                        </div>
                                    ) : selectedLetter ? (
                                        <div className="relative bg-[#fdfbf7] border border-[#d2c4a7] shadow-inner rounded-md overflow-hidden">
                                            <div
                                                className="px-6 pt-5 pb-4"
                                                style={{
                                                    backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 35px, #d2c4a7 35px, #d2c4a7 36px)',
                                                    backgroundPositionY: '52px',
                                                }}
                                            >
                                                <button
                                                    onClick={() => setSelectedLetter(null)}
                                                    className="mb-3 flex items-center gap-1 text-[#8c7d6c] hover:text-[#4a4036] text-sm font-bold uppercase tracking-wide transition-colors"
                                                >
                                                    ← Quay lại
                                                </button>
                                                <p className="text-[#8c7d6c] font-classic-serif italic mb-1 text-base h-[35px] flex items-end">Gửi tôi của ngày mai,</p>
                                                <p className="text-[#4a4036] font-classic-serif text-base whitespace-pre-wrap mb-2" style={{ lineHeight: '35px' }}>
                                                    {selectedLetter.content}
                                                </p>
                                                <p className="text-[#8c7d6c] font-classic-serif italic text-right text-sm">
                                                    Viết lúc: {new Date(selectedLetter.sent_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ) : letters.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                                            <span className="text-4xl opacity-40">📭</span>
                                            <p className="text-[#8c7d6c] font-classic-serif italic text-center">Hòm thư trống. Hãy viết thư cho tương lai của bạn!</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                                            {letters.map(letter => (
                                                <div
                                                    key={letter.id}
                                                    onClick={() => handleReadLetter(letter)}
                                                    className={`relative group flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${letter.is_read ? 'border-[#d2c4a7] bg-[#fdfbf7] hover:bg-[#f4ecd8]' : 'border-[#8c7d6c] bg-[#f4ecd8] hover:bg-[#eee0c9]'}`}
                                                >
                                                    <span className="text-xl mt-0.5">{letter.is_read ? '📩' : '💌'}</span>
                                                    <div className="flex-1 min-w-0 pr-8">
                                                        <p className={`text-sm truncate font-classic-serif ${letter.is_read ? 'text-[#8c7d6c]' : 'text-[#4a4036] font-bold'}`}>
                                                            {letter.content}
                                                        </p>
                                                        <p className="text-xs text-[#b0a090] mt-1">
                                                            {new Date(letter.deliver_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </p>
                                                    </div>

                                                    {!letter.is_read && (
                                                        <span className="absolute right-12 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                                                    )}

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteLetter(letter.id); }}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#c0b397] hover:text-red-500 p-1.5 rounded-md hover:bg-black/5 transition-all duration-200 z-20"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- CONTAINER MODAL CUSTOM ALERT --- */}
                {customAlert.isOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center animate-in fade-in duration-200">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                            onClick={() => {
                                if (customAlert.type !== 'confirm') {
                                    setCustomAlert(prev => ({ ...prev, isOpen: false }));
                                }
                            }}
                        ></div>

                        <div className="relative bg-[#fbf9f3] border-[3px] border-[#c0b397] p-6 rounded-lg w-[90%] max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <div className="absolute top-2 right-3 opacity-40 text-2xl select-none">📯</div>

                            <div className="flex items-center gap-2 mb-3 mt-1">
                                <span className="text-xl">{customAlert.type === 'confirm' ? '🗑️' : '💌'}</span>
                                <h3 className="font-classic-serif font-bold text-[#4a4036] tracking-wide text-base border-b border-[#d2c4a7] pb-0.5">
                                    {customAlert.title}
                                </h3>
                            </div>

                            <p className="font-classic-serif text-sm text-[#605446] leading-relaxed mb-6 px-1 whitespace-pre-line">
                                {customAlert.message}
                            </p>

                            {customAlert.type === 'confirm' ? (
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
                                        className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-[#4a4036] font-classic-serif font-bold text-xs rounded shadow-sm transition-colors uppercase tracking-wider"
                                    >
                                        Giữ lại thư
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (customAlert.onConfirm) customAlert.onConfirm();
                                            setCustomAlert(prev => ({ ...prev, isOpen: false }));
                                        }}
                                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-[#fdfbf7] font-classic-serif font-bold text-xs rounded shadow-sm transition-colors uppercase tracking-wider"
                                    >
                                        Xác nhận hủy
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
                                    className="w-full py-2 bg-[#8c7d6c] hover:bg-[#766859] text-[#fdfbf7] font-classic-serif font-bold text-xs rounded shadow-sm transition-colors uppercase tracking-wider"
                                >
                                    {customAlert.title === 'Thu Hoạch Thần Thụ' ? 'Cảm ơn Thần Thụ' : 'Xác nhận nhận thư'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
