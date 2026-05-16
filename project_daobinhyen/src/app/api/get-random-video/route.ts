import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin'; // Vẫn dùng Admin SDK cực xịn của bạn

export async function GET() {
    try {
        // 1. Trỏ vào collection 'healings-video'
        const videosRef = db.collection('healings-video');

        // 2. Kéo toàn bộ các documents về
        const snapshot = await videosRef.get();

        if (snapshot.empty) {
            return NextResponse.json(
                { error: "Không tìm thấy video nào trong Database" },
                { status: 404 }
            );
        }

        const videoIds: string[] = [];

        // 3. Duyệt qua từng document và nhặt lấy cái mã 'videoId'
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.videoId) {
                videoIds.push(data.videoId);
            }
        });

        if (videoIds.length === 0) {
            return NextResponse.json(
                { error: "Có document nhưng không có trường videoId nào hợp lệ" },
                { status: 404 }
            );
        }

        // 4. Quay lô tô lấy ngẫu nhiên 1 video từ mảng
        const randomVideoId = videoIds[Math.floor(Math.random() * videoIds.length)];

        // 5. Trả kết quả về cho bong bóng nước
        return NextResponse.json({ videoId: randomVideoId }, { status: 200 });

    } catch (error) {
        console.error("Lỗi khi kéo API Firebase Admin:", error);
        return NextResponse.json(
            { error: "Lỗi Server Nội bộ" },
            { status: 500 }
        );
    }
}