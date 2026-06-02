import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

const markLetterAsRead = async (req: NextRequest) => {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    const { letterId, mailId } = await req.json();
    const targetId = letterId || mailId;

    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json({ error: 'mailId không hợp lệ' }, { status: 400 });
    }

    // Chỉ truy cập thư trong collection của đúng user (uid) — không thể đọc thư người khác
    const letterRef = db
      .collection('mailbox')
      .doc(uid)
      .collection('letters')
      .doc(targetId);

    const letterSnap = await letterRef.get();
    if (!letterSnap.exists) {
      return NextResponse.json({ error: 'Không tìm thấy thư' }, { status: 404 });
    }

    const letterData = letterSnap.data();

    // Chỉ cho phép đọc thư đã được giao (delivered), không cho phép đọc thư pending
    if (letterData?.status === 'pending') {
      return NextResponse.json({ error: 'Thư chưa được giao, chưa thể đọc' }, { status: 403 });
    }

    if (letterData?.status === 'deleted') {
      return NextResponse.json({ error: 'Thư đã bị xóa' }, { status: 404 });
    }

    // Nếu đã đọc rồi thì không cần update lại
    if (letterData?.is_read === true && letterData?.status === 'read') {
      return NextResponse.json({ success: true, alreadyRead: true });
    }

    // Đồng bộ cả hai field: is_read và status
    await letterRef.update({
      is_read: true,
      status: 'read'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
};

export async function POST(req: NextRequest) {
  return markLetterAsRead(req);
}

export async function PATCH(req: NextRequest) {
  return markLetterAsRead(req);
}
