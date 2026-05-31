import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin'; // Đảm bảo đường dẫn này trỏ đúng tới file admin của bạn

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, seeds } = body;

        // Kiểm tra xem Front-end có gửi đủ userId và số hạt giống không
        if (!userId || seeds === undefined) {
            return NextResponse.json({ error: 'Thiếu dữ liệu userId hoặc seeds' }, { status: 400 });
        }

        // Cập nhật field "seeds" trong collection "users"
        await db.collection('users').doc(userId).update({
            seeds: seeds
        });

        return NextResponse.json({ success: true, message: 'Đã cập nhật hạt giống thành công' });
    } catch (error) {
        console.error("Lỗi API updateSeeds:", error);
        return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật hạt giống' }, { status: 500 });
    }
}