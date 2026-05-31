import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, updates } = body;

        // Kiểm tra xem có gửi đủ thông tin lên không
        if (!userId || !updates) {
            return NextResponse.json({ success: false, message: 'Thiếu thông tin giao dịch' }, { status: 400 });
        }

        // Trỏ vào bảng 'users' trên Firestore và cập nhật toàn bộ cục data 'updates'
        await db.collection('users').doc(userId).update(updates);

        return NextResponse.json({ success: true, message: 'Giao dịch thành công' });
    } catch (error) {
        console.error("Lỗi khi lưu giao dịch shop:", error);
        return NextResponse.json({ success: false, message: 'Lỗi server khi lưu dữ liệu' }, { status: 500 });
    }
}