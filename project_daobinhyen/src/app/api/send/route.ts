// app/api/chat/send/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// KHỞI TẠO FIREBASE ADMIN (Giống các file API khác của bạn)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}
const db = admin.firestore();

export async function POST(request: Request) {
    try {
        const { roomId, text, senderId } = await request.json();

        // 1. Kiểm tra dữ liệu đầu vào
        if (!roomId || !text || !senderId) {
            return NextResponse.json({ error: 'Thiếu thông tin gửi tin nhắn' }, { status: 400 });
        }

        // 💡 TẠI ĐÂY: Bạn có thể thêm logic lọc từ bậy bạ (bad words filter) nếu muốn
        // if (text.includes("từ bậy")) { return NextResponse.json({ error: 'Vi phạm tiêu chuẩn' }, { status: 403 }); }

        // 2. Lưu tin nhắn vào Sub-collection 'messages' của phòng chat đó
        const messageRef = await db.collection("chat_rooms").doc(roomId).collection("messages").add({
            text: text,
            senderId: senderId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. (Tùy chọn) Cập nhật thời gian nhắn tin cuối cùng của phòng chat để rảnh rỗi dọn dẹp data
        await db.collection("chat_rooms").doc(roomId).update({
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true, messageId: messageRef.id }, { status: 200 });

    } catch (error) {
        console.error("Lỗi Backend khi gửi tin nhắn:", error);
        return NextResponse.json({ error: 'Lỗi hệ thống máy chủ' }, { status: 500 });
    }
}