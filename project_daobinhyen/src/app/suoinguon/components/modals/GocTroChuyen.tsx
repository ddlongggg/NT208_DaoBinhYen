// @/haidang/components/modals/GocTroChuyen.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/app/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";

interface ChatMessage {
    id: string;
    text: string;
    sender: 'me' | 'stranger' | 'system';
    timestamp: Date;
}

interface GocTroChuyenProps {
    user: any;
    onClose: () => void;
    showAlert: (title: string, message: string, isConfirm?: boolean, confirmText?: string) => void;
}

export default function GocTroChuyen({ user, onClose, showAlert }: GocTroChuyenProps) {
    const [chatMode, setChatMode] = useState<'selection' | 'matching' | 'chatting'>('selection');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [currentChatMessage, setCurrentChatMessage] = useState('');
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [waitingTicketId, setWaitingTicketId] = useState<string | null>(null);
    const [strangerInfo, setStrangerInfo] = useState({ name: 'Người lạ giấu tên', score: 0 });

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleStartMatching = async () => {
        if (!user) {
            showAlert("Chưa đăng nhập", "Bạn cần đăng nhập để tìm kiếm bạn tâm giao.");
            return;
        }

        setChatMode('matching');

        try {
            const userRes = await fetch(`/api/user/getUserInFo?uid=${user.uid}`);
            if (!userRes.ok) throw new Error("Không thể lấy thông tin cảm xúc của bạn.");
            const myProfile = await userRes.json();

            const myEmotionScore = myProfile?.lastSurveyScore || 50;
            const myName = myProfile?.username || user.displayName || "Người lữ khách";

            const matchRes = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    name: myName,
                    emotionScore: myEmotionScore
                })
            });

            if (!matchRes.ok) throw new Error("Hệ thống ghép đôi đang bận.");
            const matchData = await matchRes.json();

            if (matchData.matched) {
                setCurrentRoomId(matchData.roomId);
                setStrangerInfo({
                    name: matchData.opponentName || 'Người lạ giấu tên',
                    score: matchData.opponentScore || 0
                });
                enterChatRoom(matchData.roomId);
            } else {
                setWaitingTicketId(matchData.waitingId);
                const ticketRef = doc(db, 'waiting_room', matchData.waitingId);
                const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
                    const ticketData = docSnap.data();
                    if (ticketData && ticketData.status === 'matched') {
                        unsubscribe();
                        setCurrentRoomId(ticketData.roomId);
                        setStrangerInfo({
                            name: ticketData.matchedWithName || 'Người lạ giấu tên',
                            score: ticketData.matchedWithScore || 0
                        });
                        enterChatRoom(ticketData.roomId);
                    }
                });
            }
        } catch (error: any) {
            console.error("Lỗi quá trình ghép đôi:", error);
            showAlert("Rễ cây đang rối", error.message || "Không thể kết nối đến hệ thống ghép đôi lúc này.");
            onClose();
        }
    };

    const enterChatRoom = (roomId: string) => {
        setChatMode('chatting');
        showAlert("Ghép thành công!", "Đã tìm thấy một người có cùng tần số cảm xúc với bạn, hãy trò chuyện và sẻ chia cùng họ nhé!");
        setChatMessages([
            { id: 'sys-1', text: 'Người lạ đã tham gia vào phòng trò chuyện.', sender: 'stranger', timestamp: new Date() }
        ]);
    };

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = currentChatMessage.trim();
        if (!messageText || !currentRoomId || !user?.uid) return;

        setCurrentChatMessage('');

        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: currentRoomId, text: messageText, senderId: user.uid })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Gửi tin nhắn thất bại");
            }
        } catch (error: any) {
            console.error("Lỗi gửi tin nhắn:", error);
            showAlert("Lỗi truyền tin", "Không gửi được tin nhắn. Hãy thử lại!");
            setCurrentChatMessage(messageText);
        }
    };

    const handleLeaveChat = async () => {
        if (!currentRoomId) {
            setChatMode('selection');
            return;
        }

        setChatMessages([]);
        setCurrentRoomId(null);
        setChatMode('selection');

        try {
            await fetch('/api/chat/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: currentRoomId, senderId: user?.uid })
            });
        } catch (error) {
            console.error("Lỗi báo rời phòng:", error);
        }
    };

    useEffect(() => {
        if (!currentRoomId || chatMode !== 'chatting' || !user) return;

        const messagesRef = collection(db, "chat_rooms", currentRoomId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribeMsg = onSnapshot(q, (snapshot) => {
            const fetchedMessages: ChatMessage[] = snapshot.docs.map(doc => {
                const data = doc.data();
                const senderType = (data.senderId === 'SYSTEM' ? 'system' : (data.senderId === user.uid ? 'me' : 'stranger')) as 'me' | 'stranger' | 'system';
                return {
                    id: doc.id,
                    text: data.text,
                    sender: senderType,
                    timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
                };
            });
            setChatMessages(fetchedMessages);
        });

        const roomRef = doc(db, "chat_rooms", currentRoomId);
        const unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
            const data = docSnap.data();
            if (data && data.status === 'ended' && chatMode === 'chatting') {
                showAlert("Đối phương đã rời đi", "Người trò chuyện đã rời khỏi phòng. Bạn sẽ được quay lại menu chính.", false, "OK");
                handleLeaveChat(); // Tự động dọn phòng khi đối phương thoát
            }
        });

        return () => {
            unsubscribeMsg();
            unsubscribeRoom();
        };
    }, [currentRoomId, chatMode, user]);

    return (
        <>
            {chatMode === 'selection' && (
                <div className="leaf-modal-overlay">
                    <div className="leaf-modal-content">
                        <button className="close-leaf-btn" onClick={onClose}>✖</button>
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
            )}

            {chatMode === 'matching' && (
                <div className="leaf-modal-overlay">
                    <div className="leaf-modal-content">
                        <h2>Bạn đợi 1 chút nhé...</h2>
                        <p>Chúng mình đang tìm 1 người phù hợp cho bạn đây!</p>
                        <div className="loading-spinner"></div>
                        <button className="cancel-btn" onClick={handleCancelMatching} style={{ marginTop: '20px' }}>Hủy ghép</button>
                    </div>
                </div>
            )}

            {chatMode === 'chatting' && (
                <div className="wood-chat-overlay">
                    <div className="wood-chat-window">
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
                                style={{ position: 'relative', zIndex: 10005 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showAlert("Rời cuộc trò chuyện", "Bạn có chắc chắn muốn rời khỏi phòng không? Mọi tin nhắn sẽ không được khôi phục đâu nhé.", true);
                                    // Lưu ý: Nút thoát của CustomAlertBox ở component cha (StreamArea) sẽ gọi hàm đóng phòng nếu isConfirm = true. 
                                    // Tuy nhiên để tối ưu bạn có thể truyền handleLeaveChat vào làm callback cho AlertBox.
                                }}
                                title="Rời khỏi phòng">
                                ✖
                            </button>
                        </div>

                        <div className="wood-chat-body" ref={chatScrollRef}>
                            {chatMessages.map(msg => (
                                <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                                    <div className="chat-bubble">
                                        {msg.text}
                                        {msg.sender !== 'system' && (
                                            <span className="chat-time">{msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form className="wood-chat-footer" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="wood-chat-input"
                                placeholder="Nhập tin nhắn..."
                                value={currentChatMessage}
                                onChange={(e) => setCurrentChatMessage(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="wood-chat-send-btn" disabled={!currentChatMessage.trim()}>Gửi 🕊️</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}