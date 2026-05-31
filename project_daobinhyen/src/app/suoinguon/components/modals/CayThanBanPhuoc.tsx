// @/haidang/components/modals/CayThanBanPhuoc.tsx
"use client";
import React, { useState } from 'react';

interface CayThanBanPhuocProps {
    onClose: () => void;
    showAlert: (title: string, message: string) => void;
}

export default function CayThanBanPhuoc({ onClose, showAlert }: CayThanBanPhuocProps) {
    const [treeMode, setTreeMode] = useState<'choosing' | 'falling' | 'reading'>('choosing');
    const [isPlucking, setIsPlucking] = useState(false);
    const [currentWish, setCurrentWish] = useState({ text: '', type: '' });
    const [fallVars, setFallVars] = useState({ startX: '50vw', endRot: '0deg' });

    const handlePluckLeaf = async (leafType: 'green' | 'red' | 'yellow') => {
        setIsPlucking(true);
        try {
            const res = await fetch(`/api/wish?type=${leafType}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Không thể bứt lá lúc này");

            setCurrentWish({ text: data.wish, type: data.type });

            const randomX = Math.floor(Math.random() * 80 + 10) + 'vw';
            const randomRot = Math.floor(Math.random() * 60 - 30) + 'deg';

            setFallVars({ startX: randomX, endRot: randomRot });
            setTreeMode('falling');

            setTimeout(() => {
                setTreeMode('reading');
            }, 5500);

        } catch (error: any) {
            console.error(error);
            showAlert("Rễ cây đang ngủ", error.message || "Cây thần đang nghỉ ngơi, bạn hãy quay lại sau nhé.");
        } finally {
            setIsPlucking(false);
        }
    };

    return (
        <>
            {treeMode === 'choosing' && (
                <div className="leaf-modal-overlay">
                    <div className="leaf-modal-content">
                        <button className="close-leaf-btn" onClick={onClose}>✖</button>
                        <h2>Mộc Thần Ban Phước</h2>
                        <p>Hãy chọn một chiếc lá mang năng lượng bạn đang cần nhất lúc này:</p>

                        <div className="leaf-options">
                            <button className="leaf-image-btn" onClick={() => handlePluckLeaf('green')} disabled={isPlucking}>
                                <div className="leaf-img-wrapper"><img src="/leaves/LaXanh.png" alt="Lá Xanh" className="leaf-bg-img" /></div>
                                <span className="leaf-text">Lá Bình Yên</span>
                            </button>
                            <button className="leaf-image-btn" onClick={() => handlePluckLeaf('red')} disabled={isPlucking}>
                                <div className="leaf-img-wrapper"><img src="/leaves/LaDo.png" alt="Lá Đỏ" className="leaf-bg-img" /></div>
                                <span className="leaf-text">Lá Yêu Thương</span>
                            </button>
                            <button className="leaf-image-btn" onClick={() => handlePluckLeaf('yellow')} disabled={isPlucking}>
                                <div className="leaf-img-wrapper"><img src="/leaves/LaVang.png" alt="Lá Vàng" className="leaf-bg-img" /></div>
                                <span className="leaf-text">Lá Động Viên</span>
                            </button>
                        </div>
                        {isPlucking && <p className="plucking-text">✨ Đang lắng nghe tiếng lá rơi...</p>}
                    </div>
                </div>
            )}

            {treeMode === 'falling' && (
                <div className="leaf-modal-overlay">
                    <img
                        src={currentWish.type === 'green' ? "/leaves/LaXanh.png" : currentWish.type === 'red' ? "/leaves/LaDo.png" : "/leaves/LaVang.png"}
                        alt="Lá đang rơi"
                        className="falling-leaf-animation"
                        style={{ '--start-x': fallVars.startX, '--end-rot': fallVars.endRot } as React.CSSProperties}
                    />
                </div>
            )}

            {treeMode === 'reading' && (
                <div className="leaf-modal-overlay leaf-modal-overlay--focused">
                    <div className="leaf-modal-content wish-card-pop">
                        <div className="leaf-img-wrapper" style={{ margin: '0 auto', filter: 'none' }}>
                            <img
                                src={currentWish.type === 'green' ? "/leaves/LaXanh.png" : currentWish.type === 'red' ? "/leaves/LaDo.png" : "/leaves/LaVang.png"}
                                alt="Lá thần"
                                className="leaf-bg-img"
                                style={{ transform: `rotate(${fallVars.endRot}) scale(1.3)` }}
                            />
                        </div>
                        <h2>Thông điệp của vũ trụ</h2>
                        <p className="wish-text" style={{ fontSize: '20px', color: '#5E3A18', fontWeight: 'bold' }}>"{currentWish.text}"</p>
                        <button className="wood-btn" onClick={onClose} style={{ marginTop: '20px' }}>Trân trọng cất giữ</button>
                    </div>
                </div>
            )}
        </>
    );
}