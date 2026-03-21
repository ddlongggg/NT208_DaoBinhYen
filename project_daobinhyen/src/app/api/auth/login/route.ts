import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'Token không hợp lệ' },
                { status: 400 }
            );
        }

        // Verify ID token từ Firebase client
        const decodedToken = await auth.verifyIdToken(idToken);

        // Tạo session cookie (7 ngày)
        const expiresIn = 60 * 60 * 24 * 7 * 1000;
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        const response = NextResponse.json(
            { message: 'Đăng nhập thành công!', uid: decodedToken.uid },
            { status: 200 }
        );

        // Set cookie bảo mật
        response.cookies.set('session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Login error:', error);

        const firebaseErrors: Record<string, string> = {
            'auth/id-token-expired': 'Phiên đăng nhập hết hạn, vui lòng thử lại',
            'auth/invalid-id-token': 'Token không hợp lệ',
            'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
        };

        const message = firebaseErrors[error.code] || 'Đăng nhập thất bại';
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
