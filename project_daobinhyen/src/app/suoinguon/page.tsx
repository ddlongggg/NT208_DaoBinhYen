"use client";
import React, { useState, useEffect, useRef } from 'react';
import './StreamArea.css';

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
// === TÍNH NĂNG NHẬT KÝ 1: Thêm Interface ===
interface DiaryEntry {
    id: string;
    content: string;
    createdAt: string;
}

export default function StreamArea() {
    const [showPageFullModal, setShowPageFullModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [boats, setBoats] = useState<Boat[]>([]);
    const [isMyBoatFloating, setIsMyBoatFloating] = useState(false);

    // State cho Bong bóng và Video
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
    // === TÍNH NĂNG NHẬT KÝ 2: Khai báo State ===
    // === THAY THẾ STATE NHẬT KÝ CŨ BẰNG CÁC STATE SAU ===
    const [diaryMode, setDiaryMode] = useState<'closed' | 'cover' | 'menu' | 'write' | 'read'>('closed');
    const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
    const [isDiaryLoading, setIsDiaryLoading] = useState(false);

    // Quản lý các trang sách (mặc định mở ra có 2 trang trống)
    const [pages, setPages] = useState<string[]>(['', '']);
    // Theo dõi đang ở cặp trang nào (0 nghĩa là đang xem trang 0 và 1)
    const [currentSpread, setCurrentSpread] = useState(0);

    // Ref dùng để tự động focus nhảy trang
    const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
    const rightTextareaRef = useRef<HTMLTextAreaElement>(null);

    // 1. Logic sinh thuyền gỗ (Tạm dừng khi thuyền giấy của mình đang trôi)
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

            setTimeout(() => {
                setBoats((prev) => prev.filter(b => b.id !== randomBoat.id));
            }, 20000);
        }, 5000);

        return () => clearInterval(interval);
    }, [isMyBoatFloating]);

    // 2. Logic sinh bong bóng và gọi API
    useEffect(() => {
        const bubbleInterval = setInterval(async () => {
            try {
                // Gọi API Route đã tạo ở trên
                const response = await fetch('/api/get-random-video');

                if (!response.ok) throw new Error("API lỗi hoặc chưa có data");

                const data = await response.json();
                const fetchedVideoId = data.videoId;

                // 1. Khai báo danh sách 3 loại bong bóng (Thay tên file cho khớp với ảnh trong public của bạn)
                const bubbleImages = ['/bongbongnuoc1.png', '/bongbongnuoc2.png', '/bongbongnuoc3.png'];

                // 2. Quay lô tô chọn ngẫu nhiên 1 ảnh bong bóng
                const randomBubbleImg = bubbleImages[Math.floor(Math.random() * bubbleImages.length)];

                const newBubble: Bubble = {
                    id: `bubble-${Date.now()}`,
                    videoId: fetchedVideoId,
                    left: `${Math.random() * 94 + 3}%`,
                    duration: `${Math.random() * 20 + 40}s`,
                    imgSrc: randomBubbleImg, // 3. Gắn ảnh vừa random vào bong bóng
                };

                setBubbles((prev) => [...prev, newBubble]);

                // 3. TĂNG THỜI GIAN CHỜ TRƯỚC KHI XÓA
                // Đổi từ 15000 (15s) thành 40000 (40s) để đảm bảo bóng đã bay khuất hẳn mới bị xóa khỏi bộ nhớ
                setTimeout(() => {
                    setBubbles((prev) => prev.filter(b => b.id !== newBubble.id));
                }, 60000);

            } catch (error) {
                console.error("Lỗi khi sinh bong bóng:", error);
            }
        }, 8000); // 8 giây sinh 1 bong bóng

        return () => clearInterval(bubbleInterval);
    }, []);

    // 3. Logic xử lý khi thả thuyền của mình
    const handleRelease = () => {
        if (!message.trim()) return;

        const myBoat: Boat = {
            id: Date.now().toString(),
            isMine: true,
            message: message,
            pathClass: 'path-mine',
        };

        setBoats((prev) => [...prev, myBoat]);
        setIsModalOpen(false);
        setMessage('');
        setIsMyBoatFloating(true);

        setTimeout(() => {
            setBoats((prev) => prev.filter(b => b.id !== myBoat.id));
            setIsMyBoatFloating(false);
        }, 20000);
    };
    // === THÊM CÁC HÀM XỬ LÝ TRANG SÁCH MỚI ===
    const handlePageInput = (index: number, value: string, isLeft: boolean) => {
        const oldValue = pages[index] || '';
        const isAdding = value.length > oldValue.length;

        // 1. Nếu đang xóa (isAdding = false), luôn cho phép cập nhật để người dùng sửa lỗi
        if (!isAdding) {
            const newPages = [...pages];
            newPages[index] = value;
            setPages(newPages);
            return;
        }

        // 2. Nếu đang gõ thêm, kiểm tra xem có vượt quá giới hạn trang không
        const currentRef = isLeft ? leftTextareaRef : rightTextareaRef;

        if (currentRef.current) {
            // Kiểm tra giả lập: Thử đưa giá trị mới vào ref để đo chiều cao trước khi cập nhật state
            if (currentRef.current.scrollHeight > currentRef.current.clientHeight) {

                if (isLeft) {
                    // Nếu là trang TRÁI: Tự động nhảy sang trang PHẢI
                    rightTextareaRef.current?.focus();
                    // Vẫn cập nhật giá trị cho trang trái vì nó sẽ tự nhảy con trỏ
                    const newPages = [...pages];
                    newPages[index] = value;
                    setPages(newPages);
                } else {
                    // Nếu là trang PHẢI: CHẶN KHÔNG CHO GÕ TIẾP
                    setShowPageFullModal(true);
                    // KHÔNG gọi setPages, để nội dung giữ nguyên ở bản cũ (oldValue)
                    // Điều này sẽ khiến ký tự vừa gõ biến mất ngay lập tức
                }
                return;
            }
        }

        // 3. Nếu mọi thứ bình thường, cập nhật state như cũ
        const newPages = [...pages];
        newPages[index] = value;
        setPages(newPages);
    };

    const turnPageNext = () => {
        // Nếu lật trang mà mảng chưa có trang mới thì tạo thêm 2 trang trống
        if (currentSpread + 2 >= pages.length) {
            setPages([...pages, '', '']);
        }
        setCurrentSpread(currentSpread + 2);
    };

    const turnPagePrev = () => {
        if (currentSpread >= 2) {
            setCurrentSpread(currentSpread - 2);
        }
    };

    // === CẬP NHẬT LẠI HÀM LƯU NHẬT KÝ ===
    const handleSaveDiary = async () => {
        // Gộp tất cả các trang lại thành 1 chuỗi hoàn chỉnh, cách nhau bởi dấu xuống dòng
        const fullContent = pages.filter(page => page.trim() !== '').join('\n\n');

        if (!fullContent) return;
        setIsDiaryLoading(true);

        // Gọi API lưu xuống Firebase
        await fetch('/api/diary', {
            method: 'POST',
            body: JSON.stringify({ content: fullContent }),
        });

        // Reset lại sách về trạng thái ban đầu sau khi lưu
        setPages(['', '']);
        setCurrentSpread(0);
        setIsDiaryLoading(false);
        setDiaryMode('menu');
    };
    const handleCloseDiary = () => {
        setDiaryMode('closed'); // Tắt giao diện sổ
        setPages(['', '']);    // Xóa sạch nội dung các trang đã viết
        setCurrentSpread(0);   // Quay về trang 1 & 2
    };
    const handleReadDiary = async () => {
        setDiaryMode('read');
        setIsDiaryLoading(true);
        // Đọc từ API (API lấy từ Firebase)
        const res = await fetch('/api/diary');
        const data = await res.json();
        setDiaryEntries(data.entries || []);
        setIsDiaryLoading(false);
    };

    // Hàm format ngày tháng cho đẹp
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="stream-wrapper">
            <img src="/SuoiNguon10AM.png" alt="Suối nguồn cảm xúc" className="stream-bg" />

            <div
                className="clickable-water"
                onClick={() => setIsModalOpen(true)}
            />

            {/* Render Bong bóng */}
            {bubbles.map((bubble) => (
                <div
                    key={bubble.id}
                    className="bubble-wrapper"
                    style={{ left: bubble.left, '--duration': bubble.duration } as React.CSSProperties}
                    onClick={() => setPlayingVideoId(bubble.videoId)}
                >
                    {/* Đổi src thành bubble.imgSrc */}
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
                                <div className="boat-label" title={boat.message}>
                                    {boat.message}
                                </div>
                            </div>
                        ) : (
                            <img src={boat.imgSrc || '/thuyengo3.png'} alt="Thuyền lạ" className="boat-img wooden" />
                        )}
                    </div>
                ))}
            </div>

            {/* Bảng nhập tâm sự */}
            {isModalOpen && (
                <div className="parchment-modal">
                    <h2 className="modal-title">Hãy chia sẻ nỗi niềm của bạn</h2>
                    <p className="modal-subtitle">
                        Trong cuộc sống này, mỗi người đều có trong mình những tâm sự. Bạn cũng không phải ngoại lệ, hãy chia sẻ với chúng tôi nhé!
                    </p>
                    <textarea
                        className="parchment-textarea"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Viết tâm sự của bạn vào đây..."
                        autoFocus
                    />
                    <div className="button-group">
                        <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Đóng</button>
                        <button className="wood-btn" onClick={handleRelease}>THẢ TRÔI</button>
                    </div>
                </div>
            )}

            {/* Màn hình phát Video YouTube */}
            {playingVideoId && (
                <div className="video-overlay" onClick={() => setPlayingVideoId(null)}>
                    <div className="video-container" onClick={(e) => e.stopPropagation()}>
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <button className="close-video-btn" onClick={() => setPlayingVideoId(null)}>Đóng Video</button>
                </div>
            )}
            {/* Vùng click mở sách */}
            <div
                className="clickable-rock"
                onClick={() => setDiaryMode('cover')} // Click vào đá sẽ mở BÌA SÁCH
                title="Mở nhật ký"
            />

            {/* === GIAO DIỆN CUỐN SỔ NHẬT KÝ === */}
            {diaryMode !== 'closed' && (
                <div className="diary-overlay">
                    <button className="close-book-btn" onClick={handleCloseDiary}>✖</button>

                    {/* 1. MÀN HÌNH BÌA SÁCH (Hình 1) */}
                    {diaryMode === 'cover' && (
                        <div className="diary-container2 cover-bg">
                            <div className="cover-content">
                                <h2>NHẬT KÍ</h2>
                                <button className="open-diary-btn" onClick={() => setDiaryMode('menu')}>
                                    MỞ NHẬT KÍ
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. MÀN HÌNH MENU & TÂM SỰ CỦA DEV (Hình 3) */}
                    {diaryMode === 'menu' && (
                        <div className="diary-container menu-bg">
                            {/* Trang trái (Da) */}
                            <div className="left-page-leather">
                                <button className="leather-btn" onClick={() => setDiaryMode('write')}>
                                    ✍️ Viết nhật ký mới
                                </button>
                                <button className="leather-btn" onClick={handleReadDiary}>
                                    📖 Đọc nhật ký cũ
                                </button>
                            </div>

                            {/* Trang phải (Giấy trắng có dòng) */}
                            <div className="right-page-paper paper-text-area">
                                <h3 className="author-title">Lời tâm sự</h3>
                                <p className="author-message">
                                    Chào bạn, người đang dừng chân tại trạm dừng này. <br /><br />
                                    Cuộc sống đôi khi rất hối hả và mệt mỏi. Tôi tạo ra cuốn nhật ký này như một nơi bí mật để bạn trút bỏ mọi muộn phiền, hoặc lưu giữ những tia hy vọng nhỏ bé nhất. <br /><br />
                                    Hãy cứ viết ra nhé, hệ thống sẽ lưu giữ nó cẩn thận cho riêng bạn. Chúc bạn một ngày bình yên!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 3. MÀN HÌNH VIẾT NHẬT KÝ */}
                    {diaryMode === 'write' && (
                        <div className="diary-container content-bg">
                            {/* Nút quay lại menu */}
                            <button className="back-btn" onClick={() => setDiaryMode('menu')}>← Menu</button>

                            {/* Khung chứa cả 2 trang sách */}
                            <div className="book-spread-area">

                                {/* TRANG BÊN TRÁI */}
                                <div className="book-page left-page">
                                    <textarea
                                        ref={leftTextareaRef}
                                        className="lined-textarea split-textarea"
                                        value={pages[currentSpread] || ''}
                                        onChange={(e) => handlePageInput(currentSpread, e.target.value, true)}
                                        placeholder={currentSpread === 0 ? "Viết những gì bạn đang nghĩ vào đây..." : ""}
                                        autoFocus
                                    />
                                    {/* Đánh dấu số trang */}
                                    <div className="page-number">{currentSpread + 1}</div>
                                </div>

                                {/* TRANG BÊN PHẢI */}
                                <div className="book-page right-page">
                                    <textarea
                                        ref={rightTextareaRef}
                                        className="lined-textarea split-textarea"
                                        value={pages[currentSpread + 1] || ''}
                                        onChange={(e) => handlePageInput(currentSpread + 1, e.target.value, false)}
                                        placeholder=""
                                    />
                                    {/* Đánh dấu số trang */}
                                    <div className="page-number">{currentSpread + 2}</div>
                                </div>

                            </div>

                            {/* CỤM NÚT ĐIỀU KHIỂN BÊN DƯỚI */}
                            <div className="book-controls">
                                {currentSpread > 0 ? (
                                    <button className="page-btn" onClick={turnPagePrev}>◀ Trang trước</button>
                                ) : (
                                    <div style={{ width: '100px' }}></div> /* Spacer để cân bằng layout */
                                )}

                                <button className="save-diary-btn" onClick={handleSaveDiary} disabled={isDiaryLoading}>
                                    {isDiaryLoading ? 'Đang cất giữ...' : 'Lưu Nhớ Toàn Bộ'}
                                </button>

                                <button className="page-btn" onClick={turnPageNext}>Trang sau ▶</button>
                            </div>
                        </div>
                    )}

                    {/* 4. MÀN HÌNH ĐỌC NHẬT KÝ (Hình 2) */}
                    {diaryMode === 'read' && (
                        <div className="diary-container content-bg">
                            <button className="back-btn" onClick={() => setDiaryMode('menu')}>← Quay lại</button>

                            <div className="right-page-paper full-read-area">
                                {isDiaryLoading ? (
                                    <p className="loading-text">Đang lật tìm ký ức...</p>
                                ) : diaryEntries.length === 0 ? (
                                    <p className="loading-text">Cuốn sổ vẫn còn giấy trắng.</p>
                                ) : (
                                    <div className="read-scroll-area">
                                        {diaryEntries.map(entry => (
                                            <div key={entry.id} className="history-item">
                                                <strong>{new Date(entry.createdAt).toLocaleDateString('vi-VN')}</strong>
                                                <p className="lined-text">{entry.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* MessageBox thông báo giữa màn hình */}
                    {showPageFullModal && (
                        <div className="custom-messagebox-overlay">
                            <div className="custom-messagebox">
                                <div className="messagebox-icon">📖</div>
                                <h3>Hết chỗ viết rồi!</h3>
                                <p>Trang giấy hiện tại đã đầy. Bạn hãy lật sang trang tiếp theo để tiếp tục ghi chép những tâm tư của mình nhé.</p>
                                <button
                                    className="messagebox-btn"
                                    onClick={() => setShowPageFullModal(false)}
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}