// app/api/garden/save/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// KHỞI TẠO FIREBASE ADMIN (Đúng chuẩn cấu trúc hệ thống của bạn)
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
        const { userId, plots } = await request.json();

        // 1. Kiểm tra dữ liệu đầu vào
        if (!userId || !plots) {
            return NextResponse.json({ error: 'Thiếu thông tin dữ liệu truyền lên!' }, { status: 400 });
        }

        // 💡 TẠI ĐÂY: Bạn có thể viết thêm logic bảo mật nâng cao
        // Ví dụ: Xác thực thêm xem Token của người gửi có trùng với userId này không.

        // 2. Thực hiện ghi dữ liệu an toàn vào document của User đó
        const docRef = db.collection("gardens").doc(userId.toString());

        // Sử dụng { merge: true } để chỉ cập nhật/ghi đè field 'plots', không xóa các field khác (nếu sau này bạn mở rộng bảng thêm bối cảnh/vàng/level...)
        await docRef.set({
            plots: plots,
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() // Lưu vết thời gian cập nhật cuối
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Lưu trạng thái khu vườn thành công!' }, { status: 200 });

    } catch (error) {
        console.error("Lỗi Backend khi lưu dữ liệu vườn:", error);
        return NextResponse.json({ error: 'Lỗi hệ thống máy chủ' }, { status: 500 });
    }
}