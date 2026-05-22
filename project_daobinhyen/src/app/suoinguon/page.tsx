"use client";
import React, { useState, useEffect, useRef } from 'react';
import './StreamArea.css';
import { db } from '@/app/lib/firebase'; // 👈 Đảm bảo đường dẫn này trỏ tới file config của bạn
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, doc, deleteDoc, orderBy } from "firebase/firestore";
import { useAuthContext } from '@/app/context/AuthContext';


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
interface DiaryEntry {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

// Thêm Interface này ở trên cùng (dưới phần interface Bubble, Boat...)
interface ChatMessage {
    id: string;
    text: string;
    sender: 'me' | 'stranger' | 'system'; // 👈 Thêm 'system' vào đây
    timestamp: Date;
}

interface AlertBoxState {
    isOpen: boolean;
    title: string;
    message: string;
    isConfirm: boolean;
    confirmText?: string; // Dấu ? có nghĩa là không bắt buộc
}
export default function StreamArea() {
    // 💡 Lấy thông tin user hiện tại
    const { user } = useAuthContext();

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
    const [diaryMode, setDiaryMode] = useState<'closed' | 'cover' | 'menu' | 'write' | 'read' | 'view'>('closed');
    const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
    const [isDiaryLoading, setIsDiaryLoading] = useState(false);

    // Quản lý các trang sách (mặc định mở ra có 2 trang trống)
    const [pages, setPages] = useState<string[]>(['', '']);
    // Theo dõi đang ở cặp trang nào (0 nghĩa là đang xem trang 0 và 1)
    const [currentSpread, setCurrentSpread] = useState(0);

    // Ref dùng để tự động focus nhảy trang
    const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
    const rightTextareaRef = useRef<HTMLTextAreaElement>(null);

    const typingTimeoutRef = useRef<any>(null);

    const [diaryTitle, setDiaryTitle] = useState('');

    // === STATE CHO CÂY LỜI CHÚC ===
    const [treeMode, setTreeMode] = useState<'closed' | 'choosing' | 'falling' | 'reading'>('closed');
    const [isPlucking, setIsPlucking] = useState(false);
    const [currentWish, setCurrentWish] = useState({ text: '', type: '' });

    // 2. Thêm state này để random vị trí rơi của lá
    const [fallVars, setFallVars] = useState({ startX: '50vw', endRot: '0deg' });

    // === STATE CHO CHAT VỚI NGƯỜI LẠ ===
    const [chatMode, setChatMode] = useState<'closed' | 'selection' | 'matching' | 'chatting'>('closed');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [currentChatMessage, setCurrentChatMessage] = useState('');
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [waitingTicketId, setWaitingTicketId] = useState<string | null>(null); // Lưu ID vé chờ để có thể Hủy
    const [strangerInfo, setStrangerInfo] = useState({ name: 'Người lạ giấu tên', score: 0 });

    // === STATE CHO CUSTOM MESSAGE BOX ===
    const [alertBox, setAlertBox] = useState<AlertBoxState>({
        isOpen: false,
        title: '',
        message: '',
        isConfirm: false,
        confirmText: 'OK' // Giá trị mặc định
    });
    //hàm dọn dẹp giấy
    const handleOpenWriteMode = () => {
        setDiaryTitle('');        // Xóa tiêu đề cũ
        setPages(['', '']);       // Tạo 2 trang giấy trắng tinh
        setCurrentSpread(0);      // Lật về trang đầu tiên
        setDiaryMode('write');    // Chuyển sang chế độ viết
    };

    // Hàm gọi thông báo tiện lợi
    const showAlert = (title: string, message: string, isConfirm: boolean = false, confirmText: string = "OK") => {
        setAlertBox({ isOpen: true, title, message, isConfirm, confirmText });
    };

    const closeAlert = () => {
        // Kiểm tra nếu thông báo đó là thông báo đối phương rời đi
        if (alertBox.title === "Đối phương đã rời đi") {
            setChatMode('selection'); // Quay về menu chọn chat
            setChatMessages([]);
            setCurrentRoomId(null);
        }
        setAlertBox(prev => ({ ...prev, isOpen: false }));
    };
    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

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
    // Định nghĩa số ký tự cho từng loại trang
    const MAX_CHARS_FIRST_PAGE = 297; // Trang 1 (Có tiêu đề nên bị ngắn đi)
    const MAX_CHARS_NORMAL_PAGE = 351; // Các trang còn lại (Full trang)

    const handlePageInput = (index: number, e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPosition = e.target.selectionStart;

        // 1. GỘP CHUỖI: Bê toàn bộ chữ của các trang lại làm 1 khối
        const textBefore = pages.slice(0, index).join('');
        const textAfter = pages.slice(index + 1).join('');
        const fullText = textBefore + newValue + textAfter;

        // 2. TÌM VỊ TRÍ CON TRỎ
        const globalCursor = textBefore.length + cursorPosition;

        // 3. CHIA TRANG: Dựa vào số lượng ký tự động
        const updatedPages: string[] = [];
        let remainingText = fullText;

        while (remainingText.length > 0) {
            // 💡 KIỂM TRA XEM ĐANG CẮT CHỮ CHO TRANG MẤY ĐỂ CHỌN ĐÚNG SỨC CHỨA
            const currentCapacity = updatedPages.length === 0 ? MAX_CHARS_FIRST_PAGE : MAX_CHARS_NORMAL_PAGE;

            if (remainingText.length <= currentCapacity) {
                updatedPages.push(remainingText);
                break;
            }

            // Ngắt từ thông minh theo giới hạn của trang đó
            let breakPoint = remainingText.lastIndexOf(' ', currentCapacity);
            let breakNewline = remainingText.lastIndexOf('\n', currentCapacity);
            breakPoint = Math.max(breakPoint, breakNewline);

            if (breakPoint <= 0) breakPoint = currentCapacity;

            updatedPages.push(remainingText.slice(0, breakPoint));
            remainingText = remainingText.slice(breakPoint);

            // Xóa khoảng trắng đầu dòng khi bị văng qua trang mới
            if (remainingText.startsWith(' ')) {
                remainingText = remainingText.substring(1);
                updatedPages[updatedPages.length - 1] += ' ';
            }
        }

        if (updatedPages.length === 0) updatedPages.push('', '');
        else if (updatedPages.length % 2 !== 0) updatedPages.push('');

        // 4. KIẾM TRANG CHỨA CON TRỎ
        let targetPageIndex = 0;
        let localCursor = globalCursor;

        for (let i = 0; i < updatedPages.length; i++) {
            if (localCursor <= updatedPages[i].length) {
                targetPageIndex = i;
                break;
            }
            localCursor -= updatedPages[i].length;
        }

        // 5. CẬP NHẬT GIAO DIỆN
        setPages(updatedPages);

        const targetSpread = Math.floor(targetPageIndex / 2) * 2;
        if (targetSpread !== currentSpread) {
            setCurrentSpread(targetSpread);
        }

        // CHỈ can thiệp vị trí con trỏ chuột nếu nó nhảy trang
        if (targetPageIndex !== index || targetSpread !== currentSpread) {
            setTimeout(() => {
                const isTargetLeft = targetPageIndex % 2 === 0;
                const targetRef = isTargetLeft ? leftTextareaRef : rightTextareaRef;
                if (targetRef?.current) {
                    targetRef.current.focus();
                    targetRef.current.setSelectionRange(localCursor, localCursor);
                }
            }, 10);
        }
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

    // ========================================================
    // LOGIC CHO TÍNH NĂNG ĐỌC NHẬT KÝ (VIEW MODE)
    // ========================================================
    const handleViewDiary = (entry: DiaryEntry) => {
        // 1. Set tiêu đề
        setDiaryTitle(entry.title);

        // 2. Thuật toán tự động cắt nội dung thành từng trang giấy
        const resultPages: string[] = [];
        let remainingText = entry.content;

        while (remainingText.length > 0) {
            const currentCapacity = resultPages.length === 0 ? MAX_CHARS_FIRST_PAGE : MAX_CHARS_NORMAL_PAGE;

            if (remainingText.length <= currentCapacity) {
                resultPages.push(remainingText);
                break;
            }

            let breakPoint = remainingText.lastIndexOf(' ', currentCapacity);
            let breakNewline = remainingText.lastIndexOf('\n', currentCapacity);
            breakPoint = Math.max(breakPoint, breakNewline);

            if (breakPoint <= 0) breakPoint = currentCapacity;

            resultPages.push(remainingText.slice(0, breakPoint));
            remainingText = remainingText.slice(breakPoint);

            if (remainingText.startsWith(' ')) {
                remainingText = remainingText.substring(1);
                resultPages[resultPages.length - 1] += ' ';
            }
        }

        // Đảm bảo sách luôn có số trang chẵn (1-2, 3-4)
        if (resultPages.length === 0) resultPages.push('', '');
        else if (resultPages.length % 2 !== 0) resultPages.push('');

        // 3. Đổ dữ liệu vào State và mở sách
        setPages(resultPages);
        setCurrentSpread(0);
        setDiaryMode('view'); // Chuyển sang chế độ View (chỉ đọc)
    };
    // === CẬP NHẬT LẠI HÀM LƯU NHẬT KÝ ===
    const handleSaveDiary = async () => {
        if (!user) {
            showAlert("Chưa đăng nhập", "Bạn cần đăng nhập để hòn đảo lưu giữ ký ức nhé!");
            return;
        }

        const fullContent = pages.filter(page => page.trim() !== '').join('\n\n');

        if (!diaryTitle.trim() && !fullContent) {
            showAlert("Trang trống", "Hãy viết gì đó trước khi lưu nhé!");
            return;
        }

        setIsDiaryLoading(true);

        try {
            // Gửi cục data (kèm uid) lên cho route.ts xử lý
            const response = await fetch('/api/diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    title: diaryTitle,
                    content: fullContent
                }),
            });

            if (!response.ok) throw new Error('Lỗi từ API');

            setPages(['', '']);
            setDiaryTitle('');
            setCurrentSpread(0);
            setDiaryMode('menu');
            showAlert("Hoàn tất", "Tâm sự của bạn đã được cất giữ an toàn!");
        } catch (error) {
            console.error("Lỗi:", error);
            showAlert("Lỗi", "Không thể lưu nhật ký, bạn hãy thử lại nhé.");
        } finally {
            setIsDiaryLoading(false);
        }
    };
    const handleCloseDiary = () => {
        setDiaryMode('closed');
        setPages(['', '']);
        setDiaryTitle(''); // <-- RESET LUÔN Ở ĐÂY CHO CHẮC
        setCurrentSpread(0);
    };
    const handleReadDiary = async () => {
        if (!user) {
            showAlert("Chưa đăng nhập", "Bạn cần đăng nhập để tìm lại ký ức cũ.");
            return;
        }

        setDiaryMode('read');
        setIsDiaryLoading(true);
        setCurrentSpread(0);

        try {
            // Truyền cái uid vào thẳng đường dẫn API để Backend lấy ra
            const res = await fetch(`/api/diary?uid=${user.uid}`);
            if (!res.ok) throw new Error('Lỗi từ API');

            const data = await res.json();
            setDiaryEntries(data.entries || []);
        } catch (error) {
            console.error("Lỗi:", error);
            showAlert("Lỗi", "Không thể tải nhật ký của bạn.");
        } finally {
            setIsDiaryLoading(false);
        }
    };

    // Hàm format ngày tháng cho đẹp
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    //Hàm xử lí cây
    const handlePluckLeaf = async (leafType: 'green' | 'red' | 'yellow') => {
        setIsPlucking(true);
        try {
            const res = await fetch(`/api/wish?type=${leafType}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Không thể bứt lá lúc này");

            // Lưu lời chúc lại
            setCurrentWish({ text: data.wish, type: data.type });

            // TẠO HIỆU ỨNG RANDOM
            // Random vị trí bắt đầu rơi (từ 10% đến 90% chiều ngang màn hình)
            const randomX = Math.floor(Math.random() * 80 + 10) + 'vw';
            // Random góc xoay khi lá đáp xuống (từ -30 độ đến 30 độ)
            const randomRot = Math.floor(Math.random() * 60 - 30) + 'deg';

            setFallVars({ startX: randomX, endRot: randomRot });

            // Chuyển sang màn hình LÁ RƠI
            setTreeMode('falling');

            // Cài đặt đồng hồ: Chờ đúng 3 giây (thời gian lá rơi) rồi mới hiện bảng lời chúc
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

    const handleStartMatching = async () => {
        if (!user) {
            showAlert("Chưa đăng nhập", "Bạn cần đăng nhập để tìm kiếm bạn tâm giao.");
            return;
        }

        // Bật màn hình Loading (Đang tìm kiếm...) ngay lập tức để user không phải chờ đợi màn hình đơ
        setChatMode('matching');

        try {
            // ==============================================================
            // BƯỚC 1: GỌI API LẤY THÔNG TIN CỦA TÔI (TÊN & CHỈ SỐ CẢM XÚC)
            // ==============================================================
            // Giả sử API của bạn là method GET và truyền uid qua query params
            // (Bạn thay đổi đường dẫn fetch cho đúng với route API của bạn nhé)
            const userRes = await fetch(`/api/user/getUserInFo?uid=${user.uid}`);

            if (!userRes.ok) {
                throw new Error("Không thể lấy thông tin cảm xúc của bạn.");
            }

            const myProfile = await userRes.json();

            // Nếu API không có điểm hoặc tên, set giá trị mặc định cho an toàn
            const myEmotionScore = myProfile?.lastSurveyScore || 50;
            const myName = myProfile?.username || user.displayName || "Người lữ khách";


            // ==============================================================
            // BƯỚC 2: GỬI DATA VỪA LẤY ĐƯỢC LÊN API GHÉP ĐÔI
            // ==============================================================
            const matchRes = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    name: myName, // Tên thật vừa lấy từ API 1
                    emotionScore: myEmotionScore // Điểm thật vừa lấy từ API 1
                })
            });

            if (!matchRes.ok) {
                throw new Error("Hệ thống ghép đôi đang bận.");
            }

            const matchData = await matchRes.json();

            // ==============================================================
            // BƯỚC 3: XỬ LÝ KẾT QUẢ GHÉP ĐÔI
            // ==============================================================
            if (matchData.matched) {
                // KỊCH BẢN A:
                setCurrentRoomId(matchData.roomId);
                setStrangerInfo({
                    name: matchData.opponentName || 'Người lạ giấu tên',
                    score: matchData.opponentScore || 0 // Đổi thành score
                });
                enterChatRoom(matchData.roomId);

            } else {
                // KỊCH BẢN B: Phải vào phòng chờ
                setWaitingTicketId(matchData.waitingId);

                const ticketRef = doc(db, 'waiting_room', matchData.waitingId);
                const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
                    const ticketData = docSnap.data();

                    if (ticketData && ticketData.status === 'matched') {
                        unsubscribe();
                        setCurrentRoomId(ticketData.roomId);
                        setStrangerInfo({
                            name: ticketData.matchedWithName || 'Người lạ giấu tên',
                            score: ticketData.matchedWithScore || 0 // Đổi thành score
                        });
                        enterChatRoom(ticketData.roomId);
                    }
                });
            }

        } catch (error: any) {
            console.error("Lỗi quá trình ghép đôi:", error);
            showAlert("Rễ cây đang rối", error.message || "Không thể kết nối đến hệ thống ghép đôi lúc này.");
            // Lỗi thì đóng modal quay về màn hình ngoài
            setChatMode('closed');
        }
    };
    // Hàm phụ: Xử lý hiển thị khi vào phòng thành công
    const enterChatRoom = (roomId: string) => {
        setChatMode('chatting');
        showAlert("Ghép thành công!", "Đã tìm thấy một người có cùng tần số cảm xúc với bạn, hãy trò chuyện và sẻ chia cùng họ nhé!");

        // Tạm thời giả lập tin nhắn hệ thống (Phần Realtime tin nhắn sẽ làm ở bước sau)
        setChatMessages([
            {
                id: 'sys-1',
                text: 'Người lạ đã tham gia vào phòng trò chuyện.',
                sender: 'stranger',
                timestamp: new Date()
            }
        ]);
    };

    // Hàm Hủy Ghép (Khi người dùng không muốn chờ nữa)
    const handleCancelMatching = async () => {
        setChatMode('selection');
        if (waitingTicketId) {
            try {
                await deleteDoc(doc(db, "waiting_room", waitingTicketId));
                setWaitingTicketId(null);
            } catch (err) {
                console.error("Lỗi hủy hàng đợi", err);
            }
        }
    };

    // GỬI TIN NHẮN QUA API BACK-END
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        const messageText = currentChatMessage.trim();
        // Kiểm tra kĩ: phải có phòng, có tin, và có user
        if (!messageText || !currentRoomId || !user?.uid) {
            console.error("Thiếu thông tin gửi:", { messageText, currentRoomId, uid: user?.uid });
            return;
        }

        setCurrentChatMessage('');

        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: currentRoomId,
                    text: messageText,
                    senderId: user.uid
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Gửi tin nhắn thất bại");
            }
        } catch (error: any) {
            console.error("Lỗi gửi tin nhắn:", error);
            showAlert("Lỗi truyền tin", "Không gửi được tin nhắn. Hãy thử lại!");
            // Hoàn tác tin nhắn nếu gửi lỗi (tùy chọn)
            setCurrentChatMessage(messageText);
        }
    };
    // HÀM RỜI KHỎI PHÒNG
    // HÀM RỜI KHỎI PHÒNG
    const handleLeaveChat = async () => {
        if (!currentRoomId) {
            setChatMode('selection'); // 👈 Sửa từ 'closed' thành 'selection'
            return;
        }

        // Đóng UI ngay cho mượt
        setChatMessages([]);
        setCurrentRoomId(null);
        setChatMode('selection'); // 👈 Đổi từ 'closed' thành 'selection' để mở bảng chọn chế độ chat

        try {
            await fetch('/api/chat/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: currentRoomId,
                    senderId: user?.uid
                })
            });
        } catch (error) {
            console.error("Lỗi báo rời phòng:", error);
        }
        // Tạo độ trễ 200ms để khung chat đóng lại hoàn toàn rồi mới hiện menu
        setTimeout(() => {
            setChatMode('selection');
        }, 200);
    };
    // LẮNG NGHE TIN NHẮN REAL-TIME (Chỉ đọc - Read only)
    useEffect(() => {
        if (!currentRoomId || chatMode !== 'chatting' || !user) return;

        // 1. Lắng nghe tin nhắn
        const messagesRef = collection(db, "chat_rooms", currentRoomId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribeMsg = onSnapshot(q, (snapshot) => {
            const fetchedMessages: ChatMessage[] = snapshot.docs.map(doc => {
                const data = doc.data();

                // 👇 ÉP KIỂU (TYPE CASTING) ở đây
                const senderType = (data.senderId === 'SYSTEM'
                    ? 'system'
                    : (data.senderId === user.uid ? 'me' : 'stranger')) as 'me' | 'stranger' | 'system';

                return {
                    id: doc.id,
                    text: data.text,
                    sender: senderType, // Gán kết quả đã ép kiểu
                    timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
                };
            });
            setChatMessages(fetchedMessages);
        });

        // 2. LẮNG NGHE TRẠNG THÁI PHÒNG (ĐỂ TỰ ĐỘNG ĐÁ NGƯỜI DÙNG RA)
        const roomRef = doc(db, "chat_rooms", currentRoomId);
        const unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
            const data = docSnap.data();

            // Nếu đối phương đã rời phòng (status là 'ended') 
            // VÀ chúng ta vẫn đang ở trong màn hình chat (chatMode === 'chatting')
            if (data && data.status === 'ended' && chatMode === 'chatting') {

                // CHỈ HIỆN THÔNG BÁO, KHÔNG DÙNG setTimeout TỰ ĐỘNG THOÁT
                showAlert(
                    "Đối phương đã rời đi",
                    "Người trò chuyện đã rời khỏi phòng. Bạn sẽ được quay lại menu chính.",
                    false, // isConfirm = false (chỉ hiện nút OK)
                    "OK"   // confirmText = "OK"
                );

                // Lưu ý: Chúng ta không cần setChatMode('closed') ở đây nữa.
                // Việc quay về menu sẽ do nút OK của alertBox đảm nhiệm (xem bước 2).
            }
        });

        return () => {
            unsubscribeMsg();
            unsubscribeRoom();
        };
    }, [currentRoomId, chatMode, user]);
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
                        ></iframe >
                    </div >
                    <button className="close-video-btn" onClick={() => setPlayingVideoId(null)}>Đóng Video</button>
                </div >
            )
            }
            {/* Vùng click mở sách */}
            <div
                className="clickable-rock"
                onClick={() => setDiaryMode('cover')} // Click vào đá sẽ mở BÌA SÁCH
                title="Mở nhật ký"
            />

            {/* === GIAO DIỆN CUỐN SỔ NHẬT KÝ === */}
            {
                diaryMode !== 'closed' && (
                    <div className="diary-overlay">
                        <button className="close-book-btn" onClick={handleCloseDiary}>✖</button>
                        {diaryMode === 'menu' && (
                            <img
                                src="/diary/butlong.png"
                                className="magic-spinning-pen"
                                style={{ width: '120px', height: '120px' }}
                                alt="Bút phép thuật"
                            />
                        )}
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
                                    {/* 👇 Sửa dòng onClick ở dưới đây 👇 */}
                                    <button className="leather-btn" onClick={handleOpenWriteMode}>
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
                                        Chào bạn, người đang mang trong lòng những tâm tư nặng trĩu. <br /><br />
                                        Cuộc sống không phải lúc nào cũng được theo ý ta muốn. Đôi khi sẽ có những khó khăn ập tới một cách bất ngờ. Nhưng bạn không biết phải tâm sự với ai. <br /><br />
                                        Đừng lo lắng, hãy cứ viết ra nhé! Chúng tôi sẽ giúp bạn lưu trữ những tâm tư này vào cuốn nhật kí. <br />Chúc bạn một ngày tốt lành!
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

                                    <div className="book-page left-page relative">
                                        {/* CHỈ HIỆN TIÊU ĐỀ Ở TRANG ĐẦU TIÊN */}
                                        {currentSpread === 0 && (
                                            <input
                                                type="text"
                                                className="diary-title-input"
                                                placeholder="Viết tiêu đề ở đây..."
                                                value={diaryTitle}
                                                onChange={(e) => setDiaryTitle(e.target.value)}
                                            />
                                        )}

                                        {/* THÊM CLASS ĐỂ ĐẨY PHẦN NỘI DUNG XUỐNG DƯỚI NẾU CÓ TIÊU ĐỀ */}
                                        <textarea
                                            key={`left-page-${currentSpread}`}
                                            ref={leftTextareaRef}
                                            className={`lined-textarea split-textarea ${currentSpread === 0 ? 'has-title' : ''}`}
                                            value={pages[currentSpread] || ''}
                                            onChange={(e) => handlePageInput(currentSpread, e)}
                                            placeholder={currentSpread === 0 ? "Viết những gì bạn đang nghĩ vào đây..." : ""}
                                        // autoFocus có thể chuyển sang ô Title nếu bạn muốn
                                        />
                                        <div className="page-number">{currentSpread + 1}</div>
                                    </div>

                                    {/* TRANG BÊN PHẢI */}
                                    <div className="book-page right-page">
                                        <textarea
                                            key={`right-page-${currentSpread}`}
                                            ref={rightTextareaRef}
                                            className="lined-textarea split-textarea"
                                            value={pages[currentSpread + 1] || ''}
                                            // 👇 CHÚ Ý DÒNG NÀY 👇
                                            onChange={(e) => handlePageInput(currentSpread + 1, e)}
                                            placeholder=""
                                        />
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

                        {/* 4. MÀN HÌNH ĐỌC NHẬT KÝ (DANH SÁCH MỤC LỤC) */}
                        {/* 4. MÀN HÌNH ĐỌC NHẬT KÝ (DANH SÁCH MỤC LỤC) */}
                        {diaryMode === 'read' && (() => {
                            // GIẢM XUỐNG 5 BÀI 1 TRANG ĐỂ KHÔNG BỊ TRÀN (Tổng 10 bài 2 trang)
                            const ENTRIES_PER_PAGE = 5;
                            const startIndex = currentSpread * (ENTRIES_PER_PAGE * 2);

                            // Cắt mảng dữ liệu cho trang trái và trang phải
                            const leftEntries = diaryEntries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);
                            const rightEntries = diaryEntries.slice(startIndex + ENTRIES_PER_PAGE, startIndex + (ENTRIES_PER_PAGE * 2));

                            return (
                                <div className="diary-container content-bg">
                                    <button className="back-btn" onClick={() => setDiaryMode('menu')}>← Menu</button>

                                    {isDiaryLoading ? (
                                        <div className="right-page-paper full-read-area">
                                            <p className="loading-text">Đang lật tìm ký ức...</p>
                                        </div>
                                    ) : diaryEntries.length === 0 ? (
                                        <div className="right-page-paper full-read-area">
                                            <p className="loading-text">Cuốn sổ vẫn còn giấy trắng.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="book-spread-area">
                                                {/* --- TRANG MỤC LỤC BÊN TRÁI --- */}
                                                <div className="book-page left-page relative">
                                                    <ul className="diary-list-menu left-menu">
                                                        {leftEntries.map(entry => (
                                                            <li key={entry.id} className="diary-list-item" onClick={() => handleViewDiary(entry)}>
                                                                <div className="diary-item-info">
                                                                    <span className="diary-item-title">{entry.title || 'Tâm sự không tên'}</span>
                                                                    <span className="diary-item-date">{formatDate(entry.createdAt)}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="page-number">{currentSpread + 1}</div>
                                                </div>

                                                {/* --- TRANG MỤC LỤC BÊN PHẢI --- */}
                                                <div className="book-page right-page relative">
                                                    <ul className="diary-list-menu right-menu">
                                                        {rightEntries.map(entry => (
                                                            <li key={entry.id} className="diary-list-item" onClick={() => handleViewDiary(entry)}>
                                                                <div className="diary-item-info">
                                                                    <span className="diary-item-title">{entry.title || 'Tâm sự không tên'}</span>
                                                                    <span className="diary-item-date">{formatDate(entry.createdAt)}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="page-number">{currentSpread + 2}</div>
                                                </div>
                                            </div>

                                            {/* --- THANH ĐIỀU KHIỂN LẬT TRANG MỤC LỤC --- */}
                                            <div className="book-controls">
                                                {currentSpread > 0 ? (
                                                    <button className="page-btn" onClick={() => setCurrentSpread(prev => prev - 1)}>◀ Trang trước</button>
                                                ) : (
                                                    <div style={{ width: '100px' }}></div>
                                                )}

                                                <div style={{ width: '150px' }}></div>

                                                {/* Nút lật sang trang sau */}
                                                {startIndex + (ENTRIES_PER_PAGE * 2) < diaryEntries.length ? (
                                                    <button className="page-btn" onClick={() => setCurrentSpread(prev => prev + 1)}>Trang sau ▶</button>
                                                ) : (
                                                    <div style={{ width: '100px' }}></div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}
                        {/* 5. MÀN HÌNH CHI TIẾT 1 BÀI NHẬT KÝ (CHỈ ĐỌC) */}
                        {diaryMode === 'view' && (
                            <div className="diary-container content-bg">
                                {/* Nút quay lại danh sách mục lục */}
                                <button className="back-btn" onClick={() => setDiaryMode('read')}>← Mục lục</button>

                                <div className="book-spread-area">
                                    <div className="book-page left-page relative">
                                        {currentSpread === 0 && (
                                            <input
                                                type="text"
                                                className="diary-title-input"
                                                value={diaryTitle}
                                                readOnly /* 👈 Khóa không cho sửa */
                                            />
                                        )}

                                        <textarea
                                            className={`lined-textarea split-textarea ${currentSpread === 0 ? 'has-title' : ''}`}
                                            value={pages[currentSpread] || ''}
                                            readOnly /* 👈 Khóa không cho sửa */
                                        />
                                        <div className="page-number">{currentSpread + 1}</div>
                                    </div>

                                    <div className="book-page right-page">
                                        <textarea
                                            className="lined-textarea split-textarea"
                                            value={pages[currentSpread + 1] || ''}
                                            readOnly /* 👈 Khóa không cho sửa */
                                        />
                                        <div className="page-number">{currentSpread + 2}</div>
                                    </div>
                                </div>

                                <div className="book-controls">
                                    {currentSpread > 0 ? (
                                        <button className="page-btn" onClick={turnPagePrev}>◀ Trang trước</button>
                                    ) : (
                                        <div style={{ width: '100px' }}></div>
                                    )}

                                    {/* Không có nút Lưu ở chế độ này, thay bằng khoảng trống để cân bằng CSS */}
                                    <div style={{ width: '150px' }}></div>

                                    {/* Chặn lật trang nếu đã hết chữ */}
                                    {currentSpread + 2 < pages.length ? (
                                        <button className="page-btn" onClick={turnPageNext}>Trang sau ▶</button>
                                    ) : (
                                        <div style={{ width: '100px' }}></div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
            {/* === GIAO DIỆN CUSTOM MESSAGE BOX === */}
            // 3. Sửa component MessageBox ở cuối file StreamArea.tsx
            {/* === GIAO DIỆN CUSTOM MESSAGE BOX === */}
            {alertBox.isOpen && (
                <div className="custom-messagebox-overlay">
                    <div className="custom-messagebox">
                        <h3>{alertBox.title}</h3>
                        <p style={{ marginBottom: '20px' }}>{alertBox.message}</p>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>

                            {/* Nút OK: CHỈ HIỆN KHI KHÔNG PHẢI LÀ XÁC NHẬN THOÁT */}
                            {!alertBox.isConfirm && (
                                <button className="messagebox-btn" onClick={closeAlert}>
                                    OK
                                </button>
                            )}

                            {/* Nút Ở LẠI: CHỈ HIỆN KHI LÀ XÁC NHẬN THOÁT */}
                            {alertBox.isConfirm && (
                                <button className="messagebox-btn" onClick={closeAlert}>
                                    Ở LẠI
                                </button>
                            )}

                            {/* Nút THOÁT: CHỈ HIỆN KHI LÀ XÁC NHẬN THOÁT */}
                            {alertBox.isConfirm && (
                                <button
                                    className="messagebox-btn"
                                    style={{ background: '#D32F2F', color: 'white' }}
                                    onClick={() => {
                                        closeAlert();
                                        handleLeaveChat();
                                    }}
                                >
                                    THOÁT
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* VÙNG CLICK CHỌN CÂY */}
            <div
                className="clickable-tree"
                onClick={() => setTreeMode('choosing')}
                title="Đến gốc cây thần"
            />
            {/* MÀN HÌNH CHỌN LÁ */}
            {
                treeMode === 'choosing' && (
                    <div className="leaf-modal-overlay">
                        <div className="leaf-modal-content">
                            <button className="close-leaf-btn" onClick={() => setTreeMode('closed')}>✖</button>
                            <h2>Mộc Thần Ban Phước</h2>
                            <p>Hãy chọn một chiếc lá mang năng lượng bạn đang cần nhất lúc này:</p>

                            {/* Khu vực chứa 3 chiếc lá */}
                            <div className="leaf-options">
                                {/* NÚT LÁ XANH */}
                                <button
                                    className="leaf-image-btn"
                                    onClick={() => handlePluckLeaf('green')}
                                    disabled={isPlucking}
                                >
                                    <div className="leaf-img-wrapper">
                                        <img src="/leaves/LaXanh.png" alt="Lá Xanh" className="leaf-bg-img" />
                                    </div>
                                    <span className="leaf-text">Lá Bình Yên</span>
                                </button>

                                {/* NÚT LÁ ĐỎ */}
                                <button
                                    className="leaf-image-btn"
                                    onClick={() => handlePluckLeaf('red')}
                                    disabled={isPlucking}
                                >
                                    <div className="leaf-img-wrapper">
                                        <img src="/leaves/LaDo.png" alt="Lá Đỏ" className="leaf-bg-img" />
                                    </div>
                                    <span className="leaf-text">Lá Yêu Thương</span>
                                </button>

                                {/* NÚT LÁ VÀNG */}
                                <button
                                    className="leaf-image-btn"
                                    onClick={() => handlePluckLeaf('yellow')}
                                    disabled={isPlucking}
                                >
                                    <div className="leaf-img-wrapper">
                                        <img src="/leaves/LaVang.png" alt="Lá Vàng" className="leaf-bg-img" />
                                    </div>
                                    <span className="leaf-text">Lá Động Viên</span>
                                </button>
                            </div>

                            {isPlucking && <p className="plucking-text">✨ Đang lắng nghe tiếng lá rơi...</p>}
                        </div>
                    </div>
                )
            }
            {/* MÀN HÌNH HIỆU ỨNG LÁ RƠI (Trong suốt hoàn toàn) */}
            {
                treeMode === 'falling' && (
                    <div className="leaf-modal-overlay"> {/* Giữ nguyên class này */}
                        <img
                            src={
                                currentWish.type === 'green' ? "/leaves/LaXanh.png" :
                                    currentWish.type === 'red' ? "/leaves/LaDo.png" :
                                        "/leaves/LaVang.png"
                            }
                            alt="Lá đang rơi"
                            className="falling-leaf-animation"
                            style={{
                                '--start-x': fallVars.startX,
                                '--end-rot': fallVars.endRot
                            } as React.CSSProperties}
                        />
                    </div>
                )
            }

            {/* MÀN HÌNH ĐỌC LỜI CHÚC (CHỈ làm mờ nền ở đây) */}
            {
                treeMode === 'reading' && (
                    // Sửa dòng này để thêm class leaf-modal-overlay--focused khi đang đọc
                    <div className="leaf-modal-overlay leaf-modal-overlay--focused">
                        <div className="leaf-modal-content wish-card-pop">
                            <div className="leaf-img-wrapper" style={{ margin: '0 auto', filter: 'none' }}>
                                <img
                                    src={
                                        currentWish.type === 'green' ? "/leaves/LaXanh.png" :
                                            currentWish.type === 'red' ? "/leaves/LaDo.png" :
                                                "/leaves/LaVang.png"
                                    }
                                    alt="Lá thần"
                                    className="leaf-bg-img"
                                    style={{ transform: `rotate(${fallVars.endRot}) scale(1.3)` }}
                                />
                            </div>

                            <h2>Thông điệp của vũ trụ</h2>
                            <p className="wish-text" style={{ fontSize: '20px', color: '#5E3A18', fontWeight: 'bold' }}>
                                "{currentWish.text}"
                            </p>

                            <button className="wood-btn" onClick={() => setTreeMode('closed')} style={{ marginTop: '20px' }}>
                                Trân trọng cất giữ
                            </button>
                        </div>
                    </div>
                )
            }
            {/* VÙNG CLICK CON MÈO */}
            <div
                className="clickable-cat"
                onClick={() => setChatMode('selection')}
                title="Trò chuyện cùng ai đó"
            />

            {/* MÀN HÌNH CHỌN CHẾ ĐỘ CHAT */}
            {
                chatMode === 'selection' && (
                    <div className="leaf-modal-overlay">
                        <div className="leaf-modal-content">
                            <button className="close-leaf-btn" onClick={() => setChatMode('closed')}>✖</button>
                            <h2>Góc Trò Chuyện</h2>
                            <p>Bạn muốn tâm sự cùng ai hôm nay?</p>

                            <div className="chat-options">
                                <button className="wood-btn chat-choice-btn disabled" disabled title="Tính năng đang được phát triển">
                                    🤖 Tâm sự với Bot (Sắp ra mắt)
                                </button>
                                <button className="wood-btn chat-choice-btn" onClick={handleStartMatching}>
                                    👤 Ghép với người lạ
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MÀN HÌNH ĐANG GHÉP ĐÔI */}
            {
                chatMode === 'matching' && (
                    <div className="leaf-modal-overlay">
                        <div className="leaf-modal-content">
                            <h2>Bạn đợi 1 chút nhé...</h2>
                            <p>Chúng mình đang tìm 1 người phù hợp cho bạn đây!</p>
                            <div className="loading-spinner"></div>
                            <button className="cancel-btn" onClick={handleCancelMatching} style={{ marginTop: '20px' }}>
                                Hủy ghép
                            </button>
                        </div>
                    </div>
                )
            }

            {/* KHUNG CHAT GIAO DIỆN GỖ */}
            {
                chatMode === 'chatting' && (
                    <div className="wood-chat-overlay">
                        <div className="wood-chat-window">
                            {/* Header */}
                            <div className="wood-chat-header">
                                <div className="chat-user-info">
                                    <div className="chat-avatar">👤</div>
                                    <div>
                                        <h3 className="chat-name">{strangerInfo.name}</h3>
                                        <span className="chat-status">🟢 Đang trực tuyến (Chỉ số cảm xúc: {strangerInfo.score})</span>
                                    </div>
                                </div>
                                <button
                                    className="chat-close-btn"
                                    style={{ position: 'relative', zIndex: 10005 }} // Ép nổi lên trên
                                    onClick={(e) => {
                                        e.stopPropagation(); // CỰC KỲ QUAN TRỌNG
                                        showAlert(
                                            "Rời cuộc trò chuyện",
                                            "Bạn có chắc chắn muốn rời khỏi phòng không? Mọi tin nhắn sẽ không được khôi phục đâu nhé.",
                                            true
                                        );
                                    }}
                                    title="Rời khỏi phòng">
                                    ✖
                                </button>
                            </div>

                            {/* Body (Khu vực hiển thị tin nhắn) */}
                            <div className="wood-chat-body" ref={chatScrollRef}>
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                                        {/* Lớp class bây giờ sẽ là 'me', 'stranger', hoặc 'system' */}
                                        <div className="chat-bubble">
                                            {msg.text}
                                            {msg.sender !== 'system' && (
                                                <span className="chat-time">
                                                    {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer (Khu vực nhập tin nhắn) */}
                            <form className="wood-chat-footer" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="wood-chat-input"
                                    placeholder="Nhập tin nhắn..."
                                    value={currentChatMessage}
                                    onChange={(e) => setCurrentChatMessage(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="wood-chat-send-btn" disabled={!currentChatMessage.trim()}>
                                    Gửi 🕊️
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}