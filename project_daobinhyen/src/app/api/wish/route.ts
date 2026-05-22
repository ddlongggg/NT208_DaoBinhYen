import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// ==========================================
// KHỞI TẠO FIREBASE ADMIN (DÙNG ENV.LOCAL)
// ==========================================
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Phải có dòng replace này để Next.js hiểu ký tự xuống dòng \n
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });
    } catch (error) {
        console.error("Lỗi khởi tạo Firebase Admin:", error);
    }
}

const db = admin.firestore();

// ==========================================
// API LẤY LỜI CHÚC TỪ MỘC THẦN (Method GET)
// ==========================================
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const leafType = searchParams.get('type');

        // Kiểm tra loại lá có hợp lệ không
        if (!leafType || !['green', 'red', 'yellow'].includes(leafType)) {
            return NextResponse.json({ error: "Loại lá không hợp lệ" }, { status: 400 });
        }

        // Dùng Firebase Admin để query
        const snapshot = await db.collection("wishes")
            .where("type", "==", leafType)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ error: "Chưa có lời chúc nào cho loại lá này." }, { status: 404 });
        }

        // Đưa dữ liệu vào mảng
        const wishesList: string[] = [];
        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.text) {
                wishesList.push(data.text);
            }
        });

        // Chọn ngẫu nhiên 1 lời chúc
        const randomWish = wishesList[Math.floor(Math.random() * wishesList.length)];

        // Tạo delay nhẹ cho cảm giác lá rơi
        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json({ wish: randomWish, type: leafType }, { status: 200 });

    } catch (error) {
        console.error("Lỗi backend khi lấy lời chúc:", error);
        return NextResponse.json({ error: 'Không thể kết nối đến Mộc thần lúc này.' }, { status: 500 });
    }
}