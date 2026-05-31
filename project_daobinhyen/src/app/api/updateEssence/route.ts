import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // essenceId sẽ là: 'lam', 'tim', 'vang', hoặc 'cam'
        const { userId, essenceId, amount } = body;

        if (!userId || !essenceId || typeof amount !== 'number') {
            return NextResponse.json(
                { success: false, message: 'Dữ liệu không hợp lệ!' },
                { status: 400 }
            );
        }

        // Lưu vào bảng users với field tên là: essence_lam, essence_tim,...
        await db.collection('users').doc(userId).set({
            [`essence_${essenceId}`]: amount
        }, { merge: true });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("❌ Lỗi API updateEssence:", error);
        return NextResponse.json({ success: false, message: 'Lỗi Backend' }, { status: 500 });
    }
}