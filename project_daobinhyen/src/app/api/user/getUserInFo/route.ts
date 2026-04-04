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
      username: data?.username ?? null,
      lastSurveyScore: data?.lastSurveyScore ?? null,
      lastSurveyType: data?.lastSurveyType ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Lỗi xác thực' }, { status: 401 });
  }
}