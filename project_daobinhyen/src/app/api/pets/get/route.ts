import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
    try {
        const sessionCookie = req.cookies.get('session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedToken.uid;

        // Tìm tất cả thú cưng của người chơi này
        const petsSnapshot = await db.collection('pets').where('userId', '==', userId).get();

        if (petsSnapshot.empty) {
            return NextResponse.json({ success: true, data: [] });
        }

        const currentTime = Date.now();
        const updatedPets = [];
        const batch = db.batch(); // Dùng batch để lưu lại các chỉ số đã bị trừ offline

        for (const doc of petsSnapshot.docs) {
            const petData = doc.data();

            // Lấy thời gian cập nhật lần cuối (nếu không có thì lấy lúc mua)
            const lastUpdated = petData.lastUpdated ? new Date(petData.lastUpdated).getTime() : new Date(petData.purchasedAt).getTime();

            // Tính số phút đã trôi qua kể từ lần cuối tương tác
            const minutesPassed = Math.floor((currentTime - lastUpdated) / 60000);

            // Logic: 2 phút trừ 1 điểm -> số điểm bị trừ = minutesPassed / 2
            const pointsToDeduct = Math.floor(minutesPassed / 2);

            let newHunger = petData.hunger;
            let newThirst = petData.thirst;

            // Nếu có thời gian trôi qua, tiến hành trừ điểm
            if (pointsToDeduct > 0) {
                newHunger = Math.max(0, petData.hunger - pointsToDeduct);
                newThirst = Math.max(0, petData.thirst - pointsToDeduct);

                // Cập nhật lại vào DB để ghi nhận sự sụt giảm
                batch.update(doc.ref, {
                    hunger: newHunger,
                    thirst: newThirst,
                    lastUpdated: new Date(currentTime).toISOString()
                });
            }

            updatedPets.push({
                id: doc.id,
                petId: petData.petId,
                name: petData.name,
                hunger: newHunger,
                thirst: newThirst,
                xp: petData.xp || 0,
                level: petData.level || 1,
                lastPetted: petData.lastPetted ? new Date(petData.lastPetted).getTime() : 0,
            });
        }

        // Thực thi việc cập nhật sự sụt giảm vào Database
        await batch.commit();

        return NextResponse.json({ success: true, data: updatedPets });

    } catch (error) {
        console.error("Lỗi API lấy thú cưng:", error);
        return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
    }
}