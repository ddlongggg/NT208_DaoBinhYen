import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

const markLetterAsRead = async (req: NextRequest) => {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Chua dang nhap' }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    const { letterId, mailId } = await req.json();
    const targetId = letterId || mailId;

    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json({ error: 'mailId khong hop le' }, { status: 400 });
    }

    const letterRef = db
      .collection('mailbox')
      .doc(uid)
      .collection('letters')
      .doc(targetId);

    const letterSnap = await letterRef.get();
    if (!letterSnap.exists) {
      return NextResponse.json({ error: 'Khong tim thay thu' }, { status: 404 });
    }

    await letterRef.update({
      is_read: true,
      status: 'read'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Loi may chu' }, { status: 500 });
  }
};

export async function POST(req: NextRequest) {
  return markLetterAsRead(req);
}

export async function PATCH(req: NextRequest) {
  return markLetterAsRead(req);
}
