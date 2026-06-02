"use client";

import React, { useEffect, useRef, useState } from "react";
import { db } from "@/app/lib/firebase";
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

interface ChatMessage {
    id: string;
    text: string;
    sender: "me" | "stranger" | "system";
    timestamp: Date;
}

interface ChatUser {
    uid: string;
    displayName?: string | null;
}

interface GocTroChuyenProps {
    user: ChatUser | null;
    onClose: () => void;
    showAlert: (title: string, message: string, isConfirm?: boolean, confirmText?: string) => void;
}

type ChatMode = "selection" | "matching" | "chatting" | "botChatting";

const BOT_INFO = {
    name: "Bạn Suối Nguồn",
};

const BOT_WELCOME_MESSAGE = "Minh o day de lang nghe ban. Hom nay trong long ban dang co dieu gi muon ke khong?";

const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
};

export default function GocTroChuyen({ user, onClose, showAlert }: GocTroChuyenProps) {
    const [chatMode, setChatMode] = useState<ChatMode>("selection");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [currentChatMessage, setCurrentChatMessage] = useState("");
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [waitingTicketId, setWaitingTicketId] = useState<string | null>(null);
    const [botSessionId, setBotSessionId] = useState<string | null>(null);
    const [botSummary, setBotSummary] = useState("");
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isLoadingBotHistory, setIsLoadingBotHistory] = useState(false);
    const [strangerInfo, setStrangerInfo] = useState({ name: "Người lạ giấu tên", score: 0 });
    const chatScrollRef = useRef<HTMLDivElement>(null);

    const isBotChat = chatMode === "botChatting";
    const activeChatName = isBotChat ? BOT_INFO.name : strangerInfo.name;

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages, isBotTyping]);

    const mapBotMessages = (messages: Array<{ id: string; text: string; sender: "me" | "bot"; timestamp: string }>): ChatMessage[] => {
        return messages.map((message) => ({
            id: message.id,
            text: message.text,
            sender: message.sender === "me" ? "me" : "stranger",
            timestamp: new Date(message.timestamp),
        }));
    };

    const applyBotSession = (data: { sessionId: string; summary?: string; messages?: Array<{ id: string; text: string; sender: "me" | "bot"; timestamp: string }> }) => {
        setBotSessionId(data.sessionId);
        setBotSummary(data.summary || "");
        setChatMessages(mapBotMessages(data.messages || []));
        return data.sessionId;
    };

    const loadLatestBotSession = async () => {
        const response = await fetch("/api/bot-chat");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Khong tai duoc lich su bot.");
        return applyBotSession(data);
    };

    const createBotSession = async () => {
        const response = await fetch("/api/bot-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "createSession" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Khong tao duoc phien bot moi.");
        return applyBotSession(data);
    };

    const saveBotMessage = async (sessionId: string, sender: "me" | "bot", text: string) => {
        const response = await fetch("/api/bot-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "saveMessage", sessionId, sender, text }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Khong luu duoc tin nhan bot.");
        if (typeof data.summary === "string") {
            setBotSummary(data.summary);
        }
        return data;
    };

    const handleStartBotChat = async () => {
        setCurrentRoomId(null);
        setWaitingTicketId(null);
        setIsLoadingBotHistory(true);
        try {
            const sessionId = await loadLatestBotSession();
            if (sessionId) {
                setChatMode("botChatting");
                return;
            }
        } catch (error) {
            console.error("Loi tai lich su bot:", error);
            showAlert("Khong tai duoc lich su", "Ban thu mo lai goc tro chuyen sau nhe.");
            return;
        } finally {
            setIsLoadingBotHistory(false);
        }
        setChatMessages([
            {
                id: "bot-welcome",
                text: "Mình ở đây để lắng nghe bạn. Hôm nay trong lòng bạn đang có điều gì muốn kể không?",
                sender: "stranger",
                timestamp: new Date(),
            },
        ]);
        setChatMode("botChatting");
    };

    const handleStartMatching = async () => {
        if (!user) {
            showAlert("Chưa đăng nhập", "Bạn cần đăng nhập để tìm kiếm bạn tâm giao.");
            return;
        }

        setChatMode("matching");

        try {
            const userRes = await fetch(`/api/user/getUserInFo?uid=${user.uid}`);
            if (!userRes.ok) throw new Error("Không thể lấy thông tin cảm xúc của bạn.");
            const myProfile = await userRes.json();

            const myEmotionScore = myProfile?.lastSurveyScore || 50;
            const myName = myProfile?.username || user.displayName || "Người lữ khách";

            const matchRes = await fetch("/api/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: user.uid,
                    name: myName,
                    emotionScore: myEmotionScore,
                }),
            });

            if (!matchRes.ok) throw new Error("Hệ thống ghép đôi đang bận.");
            const matchData = await matchRes.json();

            if (matchData.matched) {
                setCurrentRoomId(matchData.roomId);
                setStrangerInfo({
                    name: matchData.opponentName || "Người lạ giấu tên",
                    score: matchData.opponentScore || 0,
                });
                enterChatRoom(matchData.roomId);
            } else {
                setWaitingTicketId(matchData.waitingId);
                const ticketRef = doc(db, "waiting_room", matchData.waitingId);
                const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
                    const ticketData = docSnap.data();
                    if (ticketData && ticketData.status === "matched") {
                        unsubscribe();
                        setCurrentRoomId(ticketData.roomId);
                        setStrangerInfo({
                            name: ticketData.matchedWithName || "Người lạ giấu tên",
                            score: ticketData.matchedWithScore || 0,
                        });
                        enterChatRoom(ticketData.roomId);
                    }
                });
            }
        } catch (error: unknown) {
            console.error("Lỗi quá trình ghép đôi:", error);
            showAlert("Rễ cây đang rối", getErrorMessage(error, "Không thể kết nối đến hệ thống ghép đôi lúc này."));
            onClose();
        }
    };

    const enterChatRoom = (_roomId: string) => {
        setChatMode("chatting");
        showAlert("Ghép thành công!", "Đã tìm thấy một người có cùng tần số cảm xúc với bạn, hãy trò chuyện và sẻ chia cùng họ nhé!");
        setChatMessages([
            { id: "sys-1", text: "Người lạ đã tham gia vào phòng trò chuyện.", sender: "stranger", timestamp: new Date() },
        ]);
    };

    const handleCancelMatching = async () => {
        setChatMode("selection");
        if (waitingTicketId) {
            try {
                await deleteDoc(doc(db, "waiting_room", waitingTicketId));
                setWaitingTicketId(null);
            } catch (err) {
                console.error("Lỗi hủy hàng đợi", err);
            }
        }
    };

    const handleSendBotMessage = async (messageText: string) => {
        const myMessage: ChatMessage = {
            id: `me-${Date.now()}`,
            text: messageText,
            sender: "me",
            timestamp: new Date(),
        };

        const history = [...chatMessages, myMessage];
        setChatMessages(history);
        setIsBotTyping(true);

        try {
            const activeSessionId = botSessionId || await createBotSession();
            if (activeSessionId) await saveBotMessage(activeSessionId, "me", myMessage.text);

            const response = await fetch("/api/gemini-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText,
                    summary: botSummary,
                    history: history
                        .filter((msg) => msg.sender !== "system")
                        .slice(-20)
                        .map((msg) => ({
                            role: msg.sender === "me" ? "user" : "model",
                            text: msg.text,
                        })),
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Không thể gọi Gemini lúc này.");

            const botMessage: ChatMessage = {
                id: `bot-${Date.now()}`,
                text: data.reply,
                sender: "stranger",
                timestamp: new Date(),
            };

            setChatMessages((prev) => [
                ...prev,
                botMessage,
            ]);

            if (activeSessionId) await saveBotMessage(activeSessionId, "bot", botMessage.text);
        } catch (error: unknown) {
            console.error("Lỗi chatbot Gemini:", error);
            showAlert("Suối Nguồn hơi nhiễu", getErrorMessage(error, "Bot chưa thể trả lời. Bạn thử lại sau nhé."));
            setChatMessages((prev) => [
                ...prev,
                {
                    id: `bot-error-${Date.now()}`,
                    text: "Mình chưa nghe rõ được. Bạn nhắn lại cho mình một lần nữa nhé.",
                    sender: "stranger",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsBotTyping(false);
        }
    };

    const handleSendStrangerMessage = async (messageText: string) => {
        if (!currentRoomId || !user?.uid) return;

        try {
            const response = await fetch("/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId: currentRoomId, text: messageText, senderId: user.uid }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Gửi tin nhắn thất bại");
            }
        } catch (error: unknown) {
            console.error("Lỗi gửi tin nhắn:", error);
            showAlert("Lỗi truyền tin", "Không gửi được tin nhắn. Hãy thử lại!");
            setCurrentChatMessage(messageText);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = currentChatMessage.trim();
        if (!messageText || isBotTyping) return;
        if (!isBotChat && (!currentRoomId || !user?.uid)) return;

        setCurrentChatMessage("");

        if (isBotChat) {
            await handleSendBotMessage(messageText);
        } else {
            await handleSendStrangerMessage(messageText);
        }
    };

    const handleLeaveChat = async () => {
        if (isBotChat || !currentRoomId) {
            setChatMessages([]);
            setCurrentRoomId(null);
            setBotSessionId(null);
            setChatMode("selection");
            return;
        }

        const roomIdToLeave = currentRoomId;
        setChatMessages([]);
        setCurrentRoomId(null);
        setChatMode("selection");

        try {
            await fetch("/api/chat/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId: roomIdToLeave, senderId: user?.uid }),
            });
        } catch (error) {
            console.error("Lỗi báo rời phòng:", error);
        }
    };

    useEffect(() => {
        if (!currentRoomId || chatMode !== "chatting" || !user) return;

        const messagesRef = collection(db, "chat_rooms", currentRoomId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribeMsg = onSnapshot(q, (snapshot) => {
            const fetchedMessages: ChatMessage[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                const senderType = (data.senderId === "SYSTEM" ? "system" : data.senderId === user.uid ? "me" : "stranger") as ChatMessage["sender"];
                return {
                    id: docSnap.id,
                    text: data.text,
                    sender: senderType,
                    timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
                };
            });
            setChatMessages(fetchedMessages);
        });

        const roomRef = doc(db, "chat_rooms", currentRoomId);
        const unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
            const data = docSnap.data();
            if (data && data.status === "ended" && chatMode === "chatting") {
                showAlert("Đối phương đã rời đi", "Người trò chuyện đã rời khỏi phòng. Bạn sẽ được quay lại menu chính.", false, "OK");
                handleLeaveChat();
            }
        });

        return () => {
            unsubscribeMsg();
            unsubscribeRoom();
        };
    }, [currentRoomId, chatMode, user]);

    return (
        <>
            {chatMode === "selection" && (
                <div className="leaf-modal-overlay">
                    <div className="leaf-modal-content">
                        <button className="close-leaf-btn" onClick={onClose}>x</button>
                        <h2>Góc Trò Chuyện</h2>
                        <p>Bạn muốn tâm sự cùng ai hôm nay?</p>
                        <div className="chat-options">
                            <button className="wood-btn chat-choice-btn" onClick={handleStartBotChat} disabled={isLoadingBotHistory}>
                                {isLoadingBotHistory ? "Đang mở lại cuộc trò chuyện..." : "Bot tâm sự"}
                            </button>
                            <button className="wood-btn chat-choice-btn" onClick={handleStartMatching}>
                                Ghép với người lạ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {chatMode === "matching" && (
                <div className="leaf-modal-overlay">
                    <div className="leaf-modal-content">
                        <h2>Bạn đợi 1 chút nhé...</h2>
                        <p>Chúng mình đang tìm 1 người phù hợp cho bạn đây!</p>
                        <div className="loading-spinner"></div>
                        <button className="cancel-btn" onClick={handleCancelMatching} style={{ marginTop: "20px" }}>Hủy ghép</button>
                    </div>
                </div>
            )}

            {(chatMode === "chatting" || chatMode === "botChatting") && (
                <div className="wood-chat-overlay">
                    <div className="wood-chat-window">
                        <div className="wood-chat-header">
                            <div className="chat-user-info">
                                <div className="chat-avatar">{isBotChat ? "AI" : "U"}</div>
                                <div>
                                    <h3 className="chat-name">{activeChatName}</h3>
                                    <span className="chat-status">
                                        {isBotChat ? "Đang lắng nghe" : `Đang trực tuyến (Chỉ số cảm xúc: ${strangerInfo.score})`}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="chat-close-btn"
                                style={{ position: "relative", zIndex: 10005 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeaveChat();
                                }}
                                title="Rời khỏi phòng"
                            >
                                x
                            </button>
                        </div>

                        <div className="wood-chat-body" ref={chatScrollRef}>
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                                    <div className="chat-bubble">
                                        {msg.text}
                                        {msg.sender !== "system" && (
                                            <span className="chat-time">{msg.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isBotTyping && (
                                <div className="chat-message-row stranger">
                                    <div className="chat-bubble">Đang lắng nghe...</div>
                                </div>
                            )}
                        </div>

                        <form className="wood-chat-footer" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="wood-chat-input"
                                placeholder="Nhập tin nhắn..."
                                value={currentChatMessage}
                                onChange={(e) => setCurrentChatMessage(e.target.value)}
                                disabled={isBotTyping}
                                autoFocus
                            />
                            <button type="submit" className="wood-chat-send-btn" disabled={!currentChatMessage.trim() || isBotTyping}>
                                Gửi
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
