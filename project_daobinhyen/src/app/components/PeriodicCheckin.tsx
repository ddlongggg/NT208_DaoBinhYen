'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Quicksand } from 'next/font/google';
const quicksand = Quicksand({
    subsets: ['vietnamese'],
    weight: ['400', '500', '600', '700'], // Các độ đậm nhạt
    display: 'swap',
});

interface Scene {
    id: string;
    speaker: string;
    text: string;
    type?: 'options' | 'next_button';
    next?: string;
    next_text?: string;
    options?: { text: string; value?: string; next: string }[];
}

const SCORE_LEVELS = [
    { text: '1 ⭐', weight: 1 }, { text: '2 ⭐', weight: 2 },
    { text: '3 ⭐', weight: 3 }, { text: '4 ⭐', weight: 4 },
    { text: '5 ⭐', weight: 5 }, { text: '6 ⭐', weight: 6 },
    { text: '7 ⭐', weight: 7 }, { text: '8 ⭐', weight: 8 },
    { text: '9 ⭐', weight: 9 }, { text: '10 ⭐', weight: 10 },
];

const SPEAKER = 'Trưởng đảo "LÂM QUANG MINH"';

export default function PeriodicCheckin() {
    const pathname = usePathname() || '';
    const { userDataExtended } = useAuthContext();
    const [localData, setLocalData] = useState<any>(null);

    const [showPopup, setShowPopup] = useState(false);
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [trend, setTrend] = useState<'better' | 'worse' | null>(null);

    // 🔥 STATE QUẢN LÝ PHẦN THƯỞNG
    const [pendingReward, setPendingReward] = useState<{ amount: number, name: string, type: string, newLevel: number } | null>(null);
    const [rewardData, setRewardData] = useState<{ amount: number, name: string, type: string, newLevel: number } | null>(null);

    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const typingSoundRef = useRef<HTMLAudioElement | null>(null);
    const clickSoundRef = useRef<HTMLAudioElement | null>(null);

    const isSystemPage = pathname === '/' || pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/survey') || pathname.includes('/daily-checkin');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/user/getUserInFo');
                if (res.ok) setLocalData(await res.json());
            } catch (error) { }
        };
        fetchUserData();
    }, [showPopup]);

    const activeData = localData?.data || localData || userDataExtended?.data || userDataExtended;

    useEffect(() => {
        if (isSystemPage) return;
        const interval = setInterval(() => {
            setShowPopup(true);
        }, 900000); // 15 phút
        return () => clearInterval(interval);
    }, [isSystemPage]);

    useEffect(() => {
        if (showPopup && activeData) {
            const topic = activeData.lastSurveyType || 'emotion';
            const topicName = topic === 'study' ? 'Học tập' : topic === 'sleep' ? 'Giấc ngủ' : 'Cảm xúc';
            const currentScore = Number(activeData.lastSurveyScore ?? 50);

            setCurrentScene({
                id: 'intro',
                speaker: SPEAKER,
                text: `Đã 15 phút trôi qua... Ta thấy vấn đề về "${topicName}" của con hiện đang ở mức ${currentScore}/100 điểm. Dạo quanh đảo nãy giờ, con thấy tình hình lúc này thế nào rồi?`,
                type: 'options',
                options: [
                    { text: 'Dạ, con thấy khá lên một chút ☀️', value: 'better', next: 'rate_better' },
                    { text: 'Con vẫn cảm thấy bình thường 🍃', value: 'normal', next: 'process_normal' },
                    { text: 'Con thấy hơi ngột ngạt và tệ đi 🌧️', value: 'worse', next: 'rate_worse' }
                ]
            });
        }
    }, [showPopup, activeData]);

    const getGlobalVol = () => {
        if (typeof window === 'undefined') return 1;
        if (localStorage.getItem('app_muted') === 'true') return 0;
        return Number(localStorage.getItem('app_volume') ?? '70') / 100;
    };

    useEffect(() => {
        if (!currentScene?.text || !showPopup) return;

        let index = 0;
        setDisplayedText('');
        setIsTyping(true);

        const interval = setInterval(() => {
            index++;
            setDisplayedText(currentScene.text.slice(0, index));
            const sound = typingSoundRef.current;

            if (sound) {
                if (index >= currentScene.text.length) {
                    clearInterval(interval);
                    setIsTyping(false);
                    sound.pause();
                    sound.currentTime = 0;
                    return;
                }
                if (currentScene.text[index - 1] !== ' ') {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.volume = 0.2 * getGlobalVol();
                    sound.play().catch(() => { });
                    setTimeout(() => { sound.pause(); }, 60);
                }
            }
        }, 45);

        return () => {
            clearInterval(interval);
            if (typingSoundRef.current) {
                typingSoundRef.current.pause();
                typingSoundRef.current.currentTime = 0;
            }
        };
    }, [currentScene?.text, showPopup]);

    const playClickSound = () => {
        if (clickSoundRef.current) {
            clickSoundRef.current.currentTime = 0;
            clickSoundRef.current.volume = 1 * getGlobalVol();
            clickSoundRef.current.play().catch(() => { });
        }
    };

    const handleOptionSelect = async (opt: { text: string; value?: string; next: string }) => {
        playClickSound();
        const topic = activeData.lastSurveyType || 'emotion';
        const currentScore = Number(activeData.lastSurveyScore ?? 50);

        if (opt.next === 'rate_better') {
            setTrend('better');
            setCurrentScene({
                id: 'rate_better', speaker: SPEAKER,
                text: 'Mọi chuyện đang đi đúng hướng rồi! Con muốn cộng thêm bao nhiêu năng lượng (điểm) cho bản thân mình?',
                type: 'options',
                options: SCORE_LEVELS.map(s => ({ text: s.text, value: s.weight.toString(), next: 'process' }))
            });
            return;
        }

        if (opt.next === 'rate_worse') {
            setTrend('worse');
            setCurrentScene({
                id: 'rate_worse', speaker: SPEAKER,
                text: 'Không sao đâu, đôi khi chúng ta cần những khoảng lùi. Hãy trung thực với bản thân, con cảm thấy tệ đi cỡ bao nhiêu sao (điểm)?',
                type: 'options',
                options: SCORE_LEVELS.map(s => ({ text: s.text, value: s.weight.toString(), next: 'process' }))
            });
            return;
        }

        if (opt.next === 'process_normal') {
            setShowPopup(false);
            setCurrentScene(null);
            return;
        }

        if (opt.next === 'process') {
            setCurrentScene({ id: 'loading', speaker: SPEAKER, text: 'Chờ ta một chút, ta đang ghi chú lại...' });

            const weight = parseInt(opt.value || '0');
            let newScore = currentScore;

            if (trend === 'better') newScore += weight;
            if (trend === 'worse') newScore -= weight;
            if (newScore > 100) newScore = 100;
            if (newScore < 0) newScore = 0;

            try {
                const res = await fetch('/api/user/updateMiniSurvey', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, newScore })
                });

                const data = await res.json();

                let textOutro = `Ta đã cập nhật mức năng lượng của con thành ${newScore}/100. Hãy cứ thong thả dạo đảo, nhớ rằng mọi thứ rồi sẽ ổn thôi.`;

                if (trend === 'worse') {
                    if (topic === 'study') {
                        textOutro = `Ta đã ghi nhận mức ${newScore}/100. Học hành hay công việc đôi khi giống như đi ngược chiều gió vậy, rất mỏi mệt. Con hãy cứ gác lại mọi thứ, nhắm mắt một lát để hòn đảo xoa dịu tâm trí nhé.`;
                    } else if (topic === 'sleep') {
                        textOutro = `Ta hiểu rồi, điểm số của con đang ở mức ${newScore}/100. Thiếu ngủ làm thế giới trở nên nặng nề lắm. Đừng tự trách mình, lát nữa con hãy vào Nhà Gỗ nằm lên võng và để tiếng nhạc ru con vào giấc xem sao.`;
                    } else {
                        textOutro = `Điểm số hiện tại của con là ${newScore}/100. Mây mù che lối thì đành đi chậm lại vậy. Trái tim con gánh vác nhiều rồi, cứ cho phép bản thân yếu đuối một chút. Ta luôn ở đây nghe con.`;
                    }
                } else if (data.reward) {
                    textOutro = `Tuyệt vời! Ta đã ghi nhận điểm mới là ${newScore}/100. Năng lượng của con vừa thăng cấp rồi đấy! Nhận lấy chút quà mọn của ta nhé!`;
                    // 🔥 LƯU TẠM PHẦN THƯỞNG, CHƯA BẬT LÊN NGAY
                    setPendingReward(data.reward);
                }

                setCurrentScene({
                    id: 'outro', speaker: SPEAKER, text: textOutro, type: 'next_button', next_text: 'Tiếp tục dạo đảo'
                });
            } catch (error) {
                setCurrentScene({
                    id: 'error', speaker: SPEAKER, text: `Đã có lỗi xảy ra nhưng điểm của con nên là ${newScore}/100. Ta sẽ ghi nhớ sau.`, type: 'next_button', next_text: 'Tiếp tục dạo đảo'
                });
            }
            return;
        }
    };

    const getRewardIcon = (type: string) => {
        if (type === 'money') return <span className="text-[72px] leading-none drop-shadow-xl">💰</span>;
        if (type === 'seeds') return <span className="text-[72px] leading-none drop-shadow-xl">🌱</span>;

        // Nếu là Tinh Hoa thì dùng hình ảnh thực tế
        if (type === 'essence_lam') return <img src="/vuonhoa/tinhhoa/tinhhoalam.png" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" alt="Lam" />;
        if (type === 'essence_tim') return <img src="/vuonhoa/tinhhoa/tinhhoatim.png" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]" alt="Tím" />;
        if (type === 'essence_vang') return <img src="/vuonhoa/tinhhoa/tinhhoavang.png" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" alt="Vàng" />;
        if (type === 'essence_cam') return <img src="/vuonhoa/tinhhoa/tinhhoacam.png" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]" alt="Cam" />;

        return <span className="text-[72px] leading-none drop-shadow-xl">🎁</span>;
    };

    // 🔥 SỬA ĐIỀU KIỆN TRẢ VỀ: Cho phép render nếu có `rewardData` kể cả khi `currentScene` bằng null
    if (isSystemPage || !showPopup || !activeData) return null;

    return (
        <div className={`fixed inset-0 z-[9999999] overflow-hidden pointer-events-auto ${quicksand.className}`}>
            <audio ref={typingSoundRef} src="/typing.wav" preload="auto" />
            <audio ref={clickSoundRef} src="/select.wav" preload="auto" />

            {/* BACKDROP ĐEN MỜ (Phủ toàn bộ màn hình) */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all" onClick={() => {
                // Chỉ cho phép click ra ngoài để tắt nếu không phải đang gõ chữ và không có hộp quà
                if (!isTyping && !rewardData) {
                    setShowPopup(false);
                    setCurrentScene(null);
                }
            }}></div>

            {/* ==========================================
                PHẦN 1: GIAO DIỆN CỦA TRƯỞNG ĐẢO
                ========================================== */}
            {currentScene && (
                <>
                    {!isTyping && currentScene.type === 'options' && (
                        <div className="absolute inset-0 flex items-start justify-center md:justify-end md:pr-[10%] z-40 pointer-events-none pt-[5vh] md:pt-[10vh]">
                            <div className="flex flex-col gap-3 w-[90%] max-w-[450px] pointer-events-auto animate-in fade-in slide-in-from-top-10 duration-500 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                {currentScene.options?.map((opt, i) => (
                                    <button key={i} onClick={() => handleOptionSelect(opt)} className="group relative w-full py-4 px-6 bg-[#fdfbf7]/95 border-2 border-[#d2c4a7] rounded-xl text-[#4a4036] font-bold text-base shadow-lg hover:bg-[#6c7a65] hover:text-white transition-all text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#8c7d6c] group-hover:bg-white shrink-0" />
                                            <span className="leading-tight">{opt.text}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isTyping && currentScene.type === 'next_button' && (
                        <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[15%] z-50 pointer-events-none">
                            <button
                                onClick={() => {
                                    playClickSound();
                                    // 🔥 NẾU CÓ QUÀ TẠM GIỮ -> CẤT ÔNG CỤ ĐI VÀ BẬT HỘP QUÀ LÊN
                                    if (pendingReward) {
                                        setRewardData(pendingReward);
                                        setPendingReward(null);
                                        setCurrentScene(null); // Giấu ông cụ
                                    } else {
                                        // KHÔNG CÓ QUÀ -> TẮT TOÀN BỘ
                                        setShowPopup(false);
                                        setCurrentScene(null);
                                    }
                                }}
                                className="pointer-events-auto px-12 py-5 bg-[#6c7a65] text-white text-xl font-black rounded-3xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                            >
                                {currentScene.next_text} <span>→</span>
                            </button>
                        </div>
                    )}

                    <div className={`fixed bottom-[15%] left-[5%] md:left-[8%] w-[260px] h-[400px] md:w-[420px] md:h-[620px] z-10 pointer-events-none drop-shadow-2xl animate-in slide-in-from-bottom-20 duration-700`}>
                        <Image src="/oldman.png" alt="Elder" fill className="object-contain object-bottom" priority />
                    </div>

                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-[950px] z-50 animate-in zoom-in-95 duration-500">
                        <div className="relative p-8 md:p-10 bg-[#fdfbf7] border-[4px] border-[#d2c4a7] text-[#4a4036] rounded-[2.5rem] shadow-2xl min-h-[160px]">
                            <div className="absolute -top-5 left-10 px-6 py-2 bg-[#8c7d6c] text-white font-black text-sm rounded-xl shadow-md uppercase">
                                {currentScene.speaker}
                            </div>
                            <p className="text-[20px] md:text-[24px] leading-[1.6] font-bold text-[#3d342c] text-center md:text-left antialiased">
                                {displayedText}
                                {isTyping && <span className={`inline-block w-2 h-6 bg-[#8c7d6c] ml-1 animate-pulse`} />}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* ==========================================
                PHẦN 2: POPUP QUÀ (Chỉ hiện khi ông cụ đã biến mất)
                ========================================== */}
            {rewardData && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="relative bg-[#fdfbf7] border-4 border-yellow-400 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(250,204,21,0.5)] text-center w-full max-w-sm animate-in zoom-in-90 duration-300">
                        <div className="text-6xl mb-6 animate-bounce drop-shadow-xl">
                            {getRewardIcon(rewardData.type)}
                        </div>

                        <h3 className="text-2xl font-black text-yellow-600 uppercase tracking-wider mb-2">
                            Thăng Cấp Tâm Hồn!
                        </h3>

                        <p className="text-[#4a4036] font-bold text-lg mb-8 leading-relaxed">
                            Trưởng đảo LÂM QUANG MINH gửi tặng bạn
                            <span className="block text-4xl text-pink-500 font-black mt-3 drop-shadow-md">
                                + {rewardData.amount} {rewardData.name}
                            </span>
                        </p>

                        <button
                            onClick={() => {
                                playClickSound();
                                setRewardData(null);
                                setShowPopup(false);
                            }}
                            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-transform uppercase tracking-widest"
                        >
                            Thu Thập
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d2c4a7; border-radius: 10px; }
            `}} />
        </div>
    );
}