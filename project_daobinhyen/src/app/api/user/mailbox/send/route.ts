import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    const { content } = await req.json();

    // Validate nội dung
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Nội dung thư không hợp lệ' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Nội dung thư không được vượt quá 2000 ký tự' }, { status: 400 });
    }

    // Tính thời gian giao thư (24h sau)
    const deliverAt = new Date();
    deliverAt.setSeconds(deliverAt.getSeconds() + 5);

    await db
      .collection('mailbox')
      .doc(uid)
      .collection('letters')
      .add({
        content: content.trim(),
        sent_at: Timestamp.now(),
        deliver_at: Timestamp.fromDate(deliverAt),
        is_read: false,
        status: 'pending'
      });

    return NextResponse.json({ success: true, message: 'Đã gửi thư thành công!' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
