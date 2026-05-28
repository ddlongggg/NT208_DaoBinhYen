import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

type UserUpdateData = {
  username?: string;
  lastSurveyScore?: number;
  lastSurveyType?: 'study' | 'emotion' | 'sleep';
  updatedAt: string;
};

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) return new NextResponse(null, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const body = await req.json();
    const updateData: UserUpdateData = {
      updatedAt: new Date().toISOString(),
    };

    if (body.username !== undefined) {
      if (typeof body.username !== 'string') {
        return NextResponse.json({ error: 'Ten khong hop le' }, { status: 400 });
      }

      const username = body.username.trim();
      if (username.length < 2 || username.length > 30) {
        return NextResponse.json({ error: 'Ten phai tu 2 den 30 ky tu' }, { status: 400 });
      }

      const existing = await db.collection('users')
        .where('username', '==', username)
        .get();
      const isDuplicate = existing.docs.some(doc => doc.id !== decodedToken.uid);
      if (isDuplicate) {
        return NextResponse.json({ error: 'Ten nay da duoc dung, hay chon ten khac!' }, { status: 409 });
      }

      updateData.username = username;
    }

    if (body.score !== undefined) {
      if (typeof body.score !== 'number' || body.score < 0 || body.score > 100) {
        return NextResponse.json({ error: 'Diem khao sat khong hop le' }, { status: 400 });
      }
      updateData.lastSurveyScore = body.score;
    }

    if (body.surveyType !== undefined) {
      if (!['study', 'emotion', 'sleep'].includes(body.surveyType)) {
        return NextResponse.json({ error: 'Loai khao sat khong hop le' }, { status: 400 });
      }
      updateData.lastSurveyType = body.surveyType;
    }

    await db.collection('users').doc(decodedToken.uid).update(updateData);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, { status: 500 });
  }
}
