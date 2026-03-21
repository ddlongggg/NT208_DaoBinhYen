import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    console.log('ENV CHECK:', {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    });

    try {
        const { email, password, phone } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
                { status: 400 }
            );
        }

        const userRecord = await auth.createUser({
            email,
            password,
            phoneNumber: phone ? `+84${phone.replace(/^0/, '')}` : undefined,
        });

        await db.collection('users').doc(userRecord.uid).set({
            email,
            phone: phone || '',
            createdAt: new Date().toISOString(),
            role: 'user',
        });

        return NextResponse.json(
            { message: 'Đăng ký thành công!', uid: userRecord.uid },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Register error:', error);

        const firebaseErrors: Record<string, string> = {
            'auth/email-already-exists': 'Email này đã được sử dụng',
            'auth/invalid-email': 'Email không hợp lệ',
            'auth/weak-password': 'Mật khẩu quá yếu',
            'auth/phone-number-already-exists': 'Số điện thoại đã được sử dụng',
            'auth/invalid-phone-number': 'Số điện thoại không hợp lệ',
        };

        const message = firebaseErrors[error.code] || 'Đăng ký thất bại, vui lòng thử lại';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}