import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userSnap = await db.collection('users').doc(decodedToken.uid).get();

    if (!userSnap.exists) return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });

    const data = userSnap.data();

    return NextResponse.json({
      userId: decodedToken.uid,
      username: data?.username ?? null,
      lastSurveyScore: data?.lastSurveyScore ?? null,
      lastSurveyType: data?.lastSurveyType ?? null,
      lastLoginDate: data?.lastCheckinDate ?? data?.createdAt ?? new Date().toISOString(),
      topicStreak: data?.topicStreak ?? 0,

      // 🔥 BỔ SUNG: LẤY THÊM ĐIỂM TỪNG CHỦ ĐỀ CHO MINI-SURVEY 🔥
      survey_study: data?.survey_study ?? null,
      survey_emotion: data?.survey_emotion ?? null,
      survey_sleep: data?.survey_sleep ?? null,

      // Tiền và Hạt giống
      money: data?.money ?? 0,
      seeds: data?.seeds ?? 0,
      leaves: data?.leaves ?? 0,

      // Tinh hoa
      essence_lam: data?.essence_lam ?? 0,
      essence_tim: data?.essence_tim ?? 0,
      essence_vang: data?.essence_vang ?? 0,
      essence_cam: data?.essence_cam ?? 0,

      // Thú cưng
      ownedPets: data?.ownedPets || [],
    });
  } catch (error) {
    console.error("Lỗi xác thực getUserInFo:", error);
    return NextResponse.json({ error: 'Lỗi xác thực' }, { status: 401 });
  }
}