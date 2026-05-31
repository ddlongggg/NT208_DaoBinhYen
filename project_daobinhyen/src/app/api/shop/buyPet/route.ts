import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, petId, petName, costType, cost } = body;

        if (!userId || !petId) return NextResponse.json({ success: false, message: 'Thiếu thông tin!' }, { status: 400 });

        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) return NextResponse.json({ success: false, message: 'User không tồn tại!' }, { status: 404 });

        // 1. TÍNH TOÁN TRỪ TIỀN & TÀI NGUYÊN
        const updates: any = {};
        if (costType === 'money') updates.money = (userSnap.data()?.money || 0) - cost;
        if (costType === 'leaves') updates.leaves = (userSnap.data()?.leaves || 0) - cost;
        if (costType === 'essence') {
            if (cost.lam) updates.essence_lam = (userSnap.data()?.essence_lam || 0) - cost.lam;
            if (cost.tim) updates.essence_tim = (userSnap.data()?.essence_tim || 0) - cost.tim;
            if (cost.vang) updates.essence_vang = (userSnap.data()?.essence_vang || 0) - cost.vang;
            if (cost.cam) updates.essence_cam = (userSnap.data()?.essence_cam || 0) - cost.cam;
        }

        // Ghi nhớ tên thú cưng vào mảng ownedPets của User (để hiện chữ "Đã sở hữu" ở Shop)
        updates.ownedPets = FieldValue.arrayUnion(petName);

        // 2. THIẾT LẬP CHỈ SỐ SINH TỒN & RPG CHO THÚ CƯNG
        const now = new Date();
        // Lùi lại 1 tiếng (3600000 ms) để người chơi có thể vuốt ve ngay lần đầu tiên
        const oneHourAgo = new Date(now.getTime() - 3600000);

        const newPet = {
            userId: userId,
            petId: petId,
            name: petName,

            // Các chỉ số sinh tồn
            hunger: 100,
            thirst: 100,
            mood: 'happy',

            // 🔥 CÁC CHỈ SỐ RPG MỚI ĐƯỢC BỔ SUNG 🔥
            xp: 0,
            level: 1,
            purchasedAt: now.toISOString(),
            lastUpdated: now.toISOString(), // Mốc thời gian để tính toán offline
            lastPetted: oneHourAgo.toISOString() // Cho phép vuốt ve ngay lập tức
        };

        // 3. THỰC THI GIAO DỊCH (BATCH)
        const batch = db.batch();
        batch.update(userRef, updates);
        const newPetRef = db.collection('pets').doc();
        batch.set(newPetRef, newPet);
        await batch.commit();

        return NextResponse.json({ success: true, message: `Đã mua thành công ${petName}!` });
    } catch (error) {
        console.error("Lỗi API buyPet:", error);
        return NextResponse.json({ success: false, message: 'Lỗi Backend khi mua thú cưng' }, { status: 500 });
    }
}