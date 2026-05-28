import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    const now = Timestamp.now();

    // Lazy evaluation: cập nhật thư pending đã đến giờ → delivered
    const pendingLettersSnap = await db
      .collection('mailbox')
      .doc(uid)
      .collection('letters')
      .where('status', '==', 'pending')
      .where('deliver_at', '<=', now)
      .get();

    if (!pendingLettersSnap.empty) {
      const batch = db.batch();
      pendingLettersSnap.docs.forEach(doc => {
        // Đồng bộ: delivered thì is_read = false
        batch.update(doc.ref, { status: 'delivered', is_read: false });
      });
      await batch.commit();
    }

    // Lấy thư đã delivered và đã đọc
    const snapshot = await db
      .collection('mailbox')
      .doc(uid)
      .collection('letters')
      .where('status', 'in', ['delivered', 'read'])
      .orderBy('deliver_at', 'desc')
      .get();

    const letters = snapshot.docs.map(doc => {
      const data = doc.data();
      // is_read đồng bộ theo status: chỉ true khi status === 'read'
      const isRead = data.status === 'read' ? true : (data.is_read === true ? true : false);
      return {
        id: doc.id,
        content: data.content ?? '',
        sent_at: data.sent_at.toDate().toISOString(),
        deliver_at: data.deliver_at.toDate().toISOString(),
        is_read: isRead,
        status: data.status ?? 'delivered'
      };
    });

    return NextResponse.json({ letters });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}