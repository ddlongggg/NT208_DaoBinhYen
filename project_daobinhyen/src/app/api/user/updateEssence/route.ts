import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        // Đọc dữ liệu Front-end gửi lên (userId, essenceId, amount)
        const body = await request.json();
        const { userId, essenceId, amount } = body;

        // 1. Kiểm tra an toàn dữ liệu
        if (!userId || !essenceId || typeof amount !== 'number') {
            return NextResponse.json(
                { success: false, message: 'Dữ liệu không hợp lệ!' },
                { status: 400 }
            );
        }

        // 2. Tạo tên trường dữ liệu tương ứng (VD: essence_lam, essence_tim)
        const fieldName = `essence_${essenceId}`;

        // 3. Lưu vào bảng 'users' trên Firebase
        // Lệnh { merge: true } cực kỳ quan trọng: Nó giúp chỉ cập nhật đúng viên pha lê đó 
        // mà KHÔNG làm mất/xóa các dữ liệu khác đang có (như vàng, hạt giống, điểm số...)
        await db.collection('users').doc(userId).set({
            [fieldName]: amount
        }, { merge: true });

        return NextResponse.json({
            success: true,
            message: `Đã lưu ${amount} viên ${essenceId} thành công!`
        });

    } catch (error) {
        console.error("❌ Lỗi API updateEssence:", error);
        return NextResponse.json(
            { success: false, message: 'Lỗi Server khi lưu tinh hoa' },
            { status: 500 }
        );
    }
}