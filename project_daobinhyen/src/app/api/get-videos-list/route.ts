import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const chude = searchParams.get('chude');

        // 1. Trỏ vào collection 'healings-video'
        let videosRef: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query = db.collection('healings-video');

        // 2. Lọc theo chủ đề nếu người dùng bấm chọn trên thanh ngang
        if (chude && chude !== 'tat-ca') {
            videosRef = videosRef.where('chude', '==', chude);
        }

        // 3. Kéo dữ liệu về
        const snapshot = await videosRef.get();

        const videos: any[] = [];

        // 4. Gom dữ liệu lại thành 1 mảng để gửi xuống client
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Chỉ lấy những document có đủ trường videoId và title
            if (data.videoId) {
                videos.push({
                    id: doc.id,
                    videoId: data.videoId,
                    title: data.title || "Video không tên", // Gắn tên mặc định nếu Firebase bị thiếu
                    chude: data.chude || "khac"
                });
            }
        });

        // 5. Trả về toàn bộ danh sách (chứ không quay lô tô nữa)
        return NextResponse.json({ videos }, { status: 200 });

    } catch (error) {
        console.error("Lỗi khi kéo API Firebase Admin (get-list):", error);
        return NextResponse.json(
            { error: "Lỗi Server Nội bộ" },
            { status: 500 }
        );
    }
}