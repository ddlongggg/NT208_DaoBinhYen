import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // KỊCH BẢN 1: Frontend gửi lên 1 mảng 'pets' (Sử dụng khi F5 / Thoát trang)
        if (body.pets && Array.isArray(body.pets)) {
            const batch = db.batch();

            body.pets.forEach((pet: any) => {
                const petRef = db.collection('pets').doc(pet.id); // Lưu ý pet.id là Document ID
                batch.update(petRef, {
                    hunger: pet.hunger,
                    thirst: pet.thirst,
                    xp: pet.xp,
                    level: pet.level,
                    lastPetted: new Date(pet.lastPetted).toISOString(),
                    lastUpdated: new Date().toISOString()
                });
            });

            await batch.commit(); // Cập nhật tất cả cùng lúc
            return NextResponse.json({ success: true, message: 'Đã lưu đồng loạt thành công!' });
        }

        // KỊCH BẢN 2: Frontend chỉ gửi 1 con (Lưu trữ như cũ khi bấm nút Cho Ăn / Uống)
        const { petId, name, hunger, thirst, xp, level, lastPetted } = body;
        if (!petId) return NextResponse.json({ success: false, message: 'Thiếu ID thú cưng' }, { status: 400 });

        const petRef = db.collection('pets').doc(petId);

        // Cấu hình dữ liệu cần update
        const updateData: any = {
            hunger: hunger,
            thirst: thirst,
            xp: xp,
            level: level,
            lastPetted: new Date(lastPetted).toISOString(),
            lastUpdated: new Date().toISOString()
        };
        if (name) updateData.name = name; // 🔥 THÊM DÒNG NÀY

        await petRef.update(updateData);
        return NextResponse.json({ success: true, message: 'Đã lưu trạng thái' });
    } catch (error) {
        console.error("Lỗi khi update thú cưng:", error);
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}