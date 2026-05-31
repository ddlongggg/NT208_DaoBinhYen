import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);

        const { topic, newScore } = await req.json(); // topic là 'study' | 'emotion' | 'sleep'

        if (!topic || newScore === undefined) {
            return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
        }

        // 🔥 ĐÃ SỬA: Cập nhật ĐỒNG THỜI cả điểm từng môn (survey_xxx) và điểm tổng (lastSurvey...)
        await db.collection('users').doc(decodedClaims.uid).update({
            [`survey_${topic}`]: newScore,
            lastSurveyScore: newScore,
            lastSurveyType: topic
        });

        return NextResponse.json({ success: true, newScore });
    } catch (error) {
        console.error("Lỗi API updateMiniSurvey:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}