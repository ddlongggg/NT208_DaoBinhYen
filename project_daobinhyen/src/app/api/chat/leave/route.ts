import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

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
        const { roomId } = await request.json();

        const roomRef = admin.firestore().collection('chat_rooms').doc(roomId);

        // Gửi tin nhắn hệ thống trước
        await roomRef.collection('messages').add({
            text: 'Người trò chuyện đã rời khỏi phòng.',
            senderId: 'SYSTEM',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Đóng phòng bằng cách cập nhật status
        await roomRef.update({
            status: 'ended',
            endedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi' }, { status: 500 });
    }
}