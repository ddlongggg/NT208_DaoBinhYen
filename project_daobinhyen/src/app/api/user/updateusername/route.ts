import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) return new NextResponse(null, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const body = await req.json();
    const updateData: Record<string, any> = {};

    // Check trùng username
    if (body.username !== undefined) {
      const existing = await db.collection('users')
        .where('username', '==', body.username)
        .get();
      if (!existing.empty) {
        return NextResponse.json({ error: 'Tên này đã được dùng, hãy chọn tên khác!' }, { status: 409 });
      }
      updateData.username = body.username;
    }

    if (body.score !== undefined) updateData.lastSurveyScore = body.score;
    if (body.surveyType !== undefined) updateData.lastSurveyType = body.surveyType;
    updateData.updatedAt = new Date().toISOString();

    await db.collection('users').doc(decodedToken.uid).update(updateData);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}