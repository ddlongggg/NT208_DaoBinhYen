import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

export async function DELETE(req: NextRequest) {
    try {
        const sessionCookie = req.cookies.get('session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        const uid = decodedToken.uid;

        const { mailId } = await req.json();

        if (!mailId || typeof mailId !== 'string') {
            return NextResponse.json({ error: 'mailId không hợp lệ' }, { status: 400 });
        }

        // Kiểm tra thư tồn tại và thuộc về user này
        const letterRef = db
            .collection('mailbox')
            .doc(uid)
            .collection('letters')
            .doc(mailId);

        const letterSnap = await letterRef.get();
        if (!letterSnap.exists) {
            return NextResponse.json({ error: 'Không tìm thấy thư' }, { status: 404 });
        }

        await letterRef.delete();

        return NextResponse.json({ success: true, message: 'Đã xóa thư' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
    }
}