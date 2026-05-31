import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function GET() {
    try {
        // Trỏ tới Collection 'healing_messages' của bạn
        const snapshot = await db.collection('healing_messages').get();

        if (snapshot.empty) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy dữ liệu', data: [] });
        }

        const messages: string[] = [];

        // Duyệt qua từng Document và lấy trường 'text'
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.text) {
                messages.push(data.text);
            }
        });

        return NextResponse.json({ success: true, data: messages });
    } catch (error) {
        console.error("Lỗi khi lấy healing_messages:", error);
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}