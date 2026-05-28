// @/haidang/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import './StreamArea.css';
import { useAuthContext } from '@/app/context/AuthContext';

// Import các Modals đã tách
import NhatKyNeoDau from './components/modals/NhatKy';
import GocTroChuyen from './components/modals/GocTroChuyen';
import CayThanBanPhuoc from './components/modals/CayThanBanPhuoc';
import ThaThuyenModal from './components/modals/ThaThuyenModal';
import RapChieuPhimModal from './components/modals/RapChieuPhim';

interface Boat {
    id: string;
    isMine: boolean;
    message?: string;
    pathClass: string;
    imgSrc?: string;
}

interface Bubble {
    id: string;
    videoId: string;
    left: string;
    duration: string;
    imgSrc: string;
}

interface AlertBoxState {
    isOpen: boolean;
    title: string;
    message: string;
    isConfirm: boolean;
    confirmText?: string;
}

export default function StreamArea() {
    const { user } = useAuthContext();
    const [activeModal, setActiveModal] = useState<'diary' | 'tree' | 'chat' | 'boat' | null>(null);

    const [boats, setBoats] = useState<Boat[]>([]);
    const [isMyBoatFloating, setIsMyBoatFloating] = useState(false);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

    // State quản lý hình nền (để null để không bị chớp giật lúc mới vào)
    const [bgImage, setBgImage] = useState<string | null>(null);

    const [alertBox, setAlertBox] = useState<AlertBoxState>({
        isOpen: false,
        title: '',
        message: '',
        isConfirm: false,
        confirmText: 'OK'
    });

    const showAlert = (title: string, message: string, isConfirm: boolean = false, confirmText: string = "OK") => {
        setAlertBox({ isOpen: true, title, message, isConfirm, confirmText });
    };

    const closeAlert = () => {
        setAlertBox(prev => ({ ...prev, isOpen: false }));
    };

    // LOGIC THAY ĐỔI HÌNH NỀN THEO THỜI GIAN THỰC
    useEffect(() => {
        const fetchTimeAndSetBg = async () => {
            try {
                // Đảm bảo đường dẫn này trỏ đúng vào API gọi thời gian của bạn
                const res = await fetch('/api/auth/time');
                if (res.ok) {
                    const data = await res.json();
                    const currentHour = data.hour; // Lấy số giờ từ 0 - 23

                    let newBgSrc = '';

                    // Phân chia thời gian khớp với các file trong thư mục của bạn
                    if (currentHour >= 0 && currentHour < 6) {
                        newBgSrc = '/backgroundsuoinguon/SuoiNguonCamXuc0AM.png';
                    } else if (currentHour >= 6 && currentHour < 8) {
                        newBgSrc = '/backgroundsuoinguon/SuoiNguonCamXuc6AM.png';
                    } else if (currentHour >= 8 && currentHour < 12) {
                        newBgSrc = '/backgroundsuoinguon/SuoiNguonCamXuc8AM.png';
                    } else if (currentHour >= 12 && currentHour < 16) {
                        newBgSrc = '/backgroundsuoinguon/SuoiNguonCamXuc12AM.png';
                    } else if (currentHour >= 16 && currentHour < 18) {
                        newBgSrc = '/backgroundsuoinguon/SuoiNguonCamXuc4PM.png';
                    } else if (currentHour >= 18 && currentHour < 21) {
                        newBgSrc = '/backgroundsuoinguon/SuoiNguonCamXuc6PM.png';
                    } else {
                        newBgSrc = '/backgroundsuoinguon/SuoiNguonCamXuc9PM.png';
                    }

                    setBgImage(newBgSrc);
                }
            } catch (error) {
                console.error("Lỗi khi lấy thời gian thực:", error);
            }
        };

        // Gọi ngay lần đầu khi tải trang
        fetchTimeAndSetBg();

        // Tự động kiểm tra và cập nhật lại giờ mỗi 10 phút
        const timeInterval = setInterval(fetchTimeAndSetBg, 600000);

        return () => clearInterval(timeInterval);
    }, []);

    // Logic sinh thuyền gỗ
    useEffect(() => {
        if (isMyBoatFloating) return;
        const interval = setInterval(() => {
            const randomBoatConfigs = [
                { path: 'path-left', img: '/Thuyengoright.png' },
                { path: 'path-center', img: '/Thuyengoright.png' },
                { path: 'path-right', img: '/thuyengo3.png' }
            ];
            const randomConfig = randomBoatConfigs[Math.floor(Math.random() * randomBoatConfigs.length)];
            const randomBoat: Boat = {
                id: Date.now().toString() + Math.random().toString(),
                isMine: false,
                pathClass: randomConfig.path,
                imgSrc: randomConfig.img,
            };
            setBoats((prev) => [...prev, randomBoat]);
            setTimeout(() => setBoats((prev) => prev.filter(b => b.id !== randomBoat.id)), 20000);
        }, 5000);
        return () => clearInterval(interval);
    }, [isMyBoatFloating]);

    // Logic sinh bong bóng
    useEffect(() => {
        const bubbleInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/get-random-video');
                if (!response.ok) throw new Error("API lỗi");
                const data = await response.json();
                const bubbleImages = ['/bongbongnuoc1.png', '/bongbongnuoc2.png', '/bongbongnuoc3.png'];
                const randomBubbleImg = bubbleImages[Math.floor(Math.random() * bubbleImages.length)];

                const newBubble: Bubble = {
                    id: `bubble-${Date.now()}`,
                    videoId: data.videoId,
                    left: `${Math.random() * 94 + 3}%`,
                    duration: `${Math.random() * 20 + 40}s`,
                    imgSrc: randomBubbleImg,
                };
                setBubbles((prev) => [...prev, newBubble]);
                setTimeout(() => setBubbles((prev) => prev.filter(b => b.id !== newBubble.id)), 60000);
            } catch (error) {
                console.error("Lỗi khi sinh bong bóng:", error);
            }
        }, 8000);
        return () => clearInterval(bubbleInterval);
    }, []);

    const handleReleaseBoat = (message: string) => {
        const myBoat: Boat = {
            id: Date.now().toString(),
            isMine: true,
            message: message,
            pathClass: 'path-mine',
        };
        setBoats((prev) => [...prev, myBoat]);
        setActiveModal(null);
        setIsMyBoatFloating(true);
        setTimeout(() => {
            setBoats((prev) => prev.filter(b => b.id !== myBoat.id));
            setIsMyBoatFloating(false);
        }, 20000);
    };

    const handleConfirmAlert = () => {
        closeAlert();
        setActiveModal(null); // Đóng thẳng tay modal đang mở
    };

    return (
        <div className="stream-wrapper">
            {/* Chỉ render hình nền khi bgImage đã có đường dẫn */}
            {bgImage && (
                <img src={bgImage} alt="Suối nguồn cảm xúc" className="stream-bg" />
            )}

            {/* CÁC VÙNG TƯƠNG TÁC KÈM TOOLTIP MA THUẬT */}
            <div className="clickable-water" onClick={() => setActiveModal('boat')}>
                <div className="magic-tooltip">
                    <h4>⛵ Thuyền Tâm Sự</h4>
                    <p>Thả trôi những muộn phiền theo dòng nước</p>
                </div>
            </div>

            <div className="clickable-rock" onClick={() => setActiveModal('diary')}>
                <div className="magic-tooltip">
                    <h4>📖 Nhật Ký Neo Đậu</h4>
                    <p>Nơi cất giữ những tâm tư thầm kín</p>
                </div>
            </div>

            <div className="clickable-tree" onClick={() => setActiveModal('tree')}>
                <div className="magic-tooltip">
                    <h4>🌳 Mộc Thần Ban Phước</h4>
                    <p>Nhận thông điệp chữa lành từ vũ trụ</p>
                </div>
            </div>

            <div className="clickable-cat" onClick={() => setActiveModal('chat')}>
                <div className="magic-tooltip">
                    <h4>🐱 Góc Trò Chuyện</h4>
                    <p>Tìm một người cùng tần số để sẻ chia</p>
                </div>
            </div>

            {/* Render Bong bóng */}
            {bubbles.map((bubble) => (
                <div key={bubble.id} className="bubble-wrapper" style={{ left: bubble.left, '--duration': bubble.duration } as React.CSSProperties} onClick={() => setPlayingVideoId(bubble.videoId)}>
                    <img src={bubble.imgSrc} alt="Bong bóng chữa lành" className="bubble-img" />
                </div>
            ))}

            {/* Render Thuyền */}
            <div className="boats-container">
                {boats.map((boat) => (
                    <div key={boat.id} className={`boat-wrapper ${boat.pathClass}`}>
                        {boat.isMine ? (
                            <div className="my-boat-group">
                                <div className="magic-arrow">✨ ↘</div>
                                <img src="/ThuyenGiay3.png" alt="Thuyền của bạn" className="boat-img origami" />
                                <div className="boat-label" title={boat.message}>{boat.message}</div>
                            </div>
                        ) : (
                            <img src={boat.imgSrc || '/thuyengo3.png'} alt="Thuyền lạ" className="boat-img wooden" />
                        )}
                    </div>
                ))}
            </div>

            {/* MODALS */}
            {activeModal === 'boat' && <ThaThuyenModal onClose={() => setActiveModal(null)} onRelease={handleReleaseBoat} />}
            {activeModal === 'diary' && <NhatKyNeoDau user={user} onClose={() => setActiveModal(null)} showAlert={showAlert} />}
            {activeModal === 'tree' && <CayThanBanPhuoc onClose={() => setActiveModal(null)} showAlert={showAlert} />}
            {activeModal === 'chat' && <GocTroChuyen user={user} onClose={() => setActiveModal(null)} showAlert={showAlert} />}

            {/* Video Player */}
            {playingVideoId && (
                <RapChieuPhimModal
                    initialVideoId={playingVideoId}
                    onClose={() => setPlayingVideoId(null)}
                />
            )}

            {/* Alert Box */}
            {alertBox.isOpen && (
                <div className="custom-messagebox-overlay">
                    <div className="custom-messagebox">
                        <h3>{alertBox.title}</h3>
                        <p style={{ marginBottom: '20px' }}>{alertBox.message}</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            {!alertBox.isConfirm && <button className="messagebox-btn" onClick={closeAlert}>OK</button>}
                            {alertBox.isConfirm && <button className="messagebox-btn" onClick={closeAlert}>Ở LẠI</button>}
                            {alertBox.isConfirm && (
                                <button className="messagebox-btn" style={{ background: '#D32F2F', color: 'white' }} onClick={handleConfirmAlert}>
                                    THOÁT
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}