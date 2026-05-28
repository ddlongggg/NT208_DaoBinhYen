import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        // Lấy dữ liệu từ hàm syncMoneyToBackend gửi lên
        const body = await request.json();
        const { userId, money } = body;

        // Kiểm tra an toàn dữ liệu
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy ID người dùng!' },
                { status: 400 }
            );
        }

        if (typeof money !== 'number' || money < 0) {
            return NextResponse.json(
                { success: false, message: 'Số vàng không hợp lệ!' },
                { status: 400 }
            );
        }

        // Truy cập vào collection 'users' và cập nhật trường 'money'
        await db.collection('users').doc(userId).update({
            money: money
        });

        return NextResponse.json({
            success: true,
            message: 'Đã cập nhật Vàng thành công!'
        });

    } catch (error) {
        console.error("❌ Lỗi API updateMoney:", error);
        return NextResponse.json(
            { success: false, message: 'Lỗi hệ thống Back-end' },
            { status: 500 }
        );
    }
}