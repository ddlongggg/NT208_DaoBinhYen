// @/haidang/components/modals/RapChieuPhim.tsx
"use client";
import React, { useState, useEffect } from 'react';

interface VideoItem {
    id: string;
    videoId: string;
    title: string;
    chude: string;
}

interface RapChieuPhimProps {
    initialVideoId: string;
    onClose: () => void;
}

// Đã gõ lại bằng Unicode chuẩn (NFC) để không bị lỗi tách dấu
const CATEGORIES = [
    { id: 'tat-ca', label: '🌟 Tất cả' },
    { id: 'tinh-yeu', label: '💕 Tình yêu' },
    { id: 'tinh-ban', label: '🤝 Tình bạn' },
    { id: 'gia-dinh', label: '🏡 Gia đình' },
    { id: 'chua-lanh', label: '🌿 Chữa lành' },
    { id: 'dong-luc', label: '🔥 Động lực' },
    { id: 'khac', label: '✨ Chủ đề khác' } // Đã thêm Chủ đề khác
];

export default function RapChieuPhim({ initialVideoId, onClose }: RapChieuPhimProps) {
    const [viewMode, setViewMode] = useState<'playing' | 'browsing'>('playing');
    const [currentVideoId, setCurrentVideoId] = useState(initialVideoId);

    const [activeCategory, setActiveCategory] = useState('tat-ca');
    const [videoList, setVideoList] = useState<VideoItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchVideosByCategory = async (chude: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/get-videos-list?chude=${chude}`);
            if (!response.ok) throw new Error("Không thể tải danh sách video");

            const data = await response.json();
            setVideoList(data.videos || []);
        } catch (error) {
            console.error("Lỗi khi tải danh sách:", error);
            setVideoList([
                { id: '1', videoId: 'dQw4w9WgXcQ', title: 'Video âm nhạc chữa lành tâm hồn', chude: 'chua-lanh' },
                { id: '2', videoId: 'jNQXAC9IVRw', title: 'Tại sao tình bạn lại quan trọng?', chude: 'tinh-ban' },
                { id: '3', videoId: 'lWA2pjMjpBs', title: 'Vượt qua sự trì hoãn', chude: 'dong-luc' },
                { id: '4', videoId: '3JZ_D3ELwOQ', title: 'Bản nhạc dành cho ngày mưa', chude: 'tinh-yeu' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'browsing') {
            fetchVideosByCategory(activeCategory);
        }
    }, [activeCategory, viewMode]);

    const handlePlayVideo = (vidId: string) => {
        setCurrentVideoId(vidId);
        setViewMode('playing');
    };

    return (
        <div className="cinema-overlay">
            <div className="cinema-backdrop" onClick={onClose}></div>

            <div className={`cinema-container ${viewMode === 'browsing' ? 'browsing-mode' : ''}`}>
                <button className="cinema-close-btn" onClick={onClose} title="Rời rạp">✖</button>

                {viewMode === 'playing' ? (
                    <div className="cinema-screen-wrapper">
                        <div className="cinema-screen-glow"></div>
                        <div className="cinema-screen">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
                                title="Rạp chiếu ký ức"
                                frameBorder="0"
                                allow="autoplay; fullscreen; encrypted-media"
                                allowFullScreen
                            ></iframe>
                        </div>

                        <div className="cinema-controls">
                            <button className="cinema-switch-btn" onClick={() => setViewMode('browsing')}>
                                🎞️ Khám phá thư viện video
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="youtube-layout-wrapper">
                        <div className="youtube-header">
                            <button className="back-to-play-btn" onClick={() => setViewMode('playing')}>
                                ← Quay lại video đang xem
                            </button>
                            {/* Chữ được gõ lại chuẩn Unicode */}
                            <h2 className="youtube-title">Thư viện</h2>
                        </div>

                        <div className="youtube-category-bar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`youtube-chip ${activeCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="youtube-video-area">
                            {isLoading ? (
                                <div className="cinema-loading"><div className="spinner"></div></div>
                            ) : videoList.length === 0 ? (
                                <p className="no-video-msg">Chưa có video nào trong chủ đề này.</p>
                            ) : (
                                <div className="youtube-video-grid">
                                    {videoList.map(video => (
                                        <div key={video.id} className="youtube-video-card" onClick={() => handlePlayVideo(video.videoId)}>
                                            <div className="thumbnail-container">
                                                <img
                                                    src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                                                    alt={video.title}
                                                    className="video-thumbnail"
                                                />
                                                <div className="play-overlay">▶ Phát ngay</div>
                                            </div>
                                            <h4 className="video-card-title">{video.title}</h4>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}