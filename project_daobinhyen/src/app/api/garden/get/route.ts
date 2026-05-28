import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
    try {
        // 1. Tự lấy cookie session trực tiếp ở backend
        const sessionCookie = req.cookies.get('session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

        // 2. Xác thực để lấy UID
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedToken.uid;

        // 3. Lấy dữ liệu vườn từ Firestore
        const gardenDoc = await db.collection('gardens').doc(userId).get();

        if (!gardenDoc.exists) {
            const defaultPlots = Array.from({ length: 6 }, (_, index) => ({
                id: index + 1,
                status: 'empty',
                selectedTree: null,
                timeLeft: 0,
                reward: null
            }));
            return NextResponse.json({ success: true, data: { plots: defaultPlots } });
        }

        return NextResponse.json({ success: true, data: gardenDoc.data() });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi xác thực hoặc Server' }, { status: 401 });
    }
}