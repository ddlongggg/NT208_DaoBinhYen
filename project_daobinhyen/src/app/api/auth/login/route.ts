import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 400 });
        }

        const decodedToken = await auth.verifyIdToken(idToken);
        console.log('DECODED TOKEN:', decodedToken.uid, decodedToken.email);

        // Chỉ check verify với email/password, bỏ qua Google/Facebook
const isEmailProvider = decodedToken.firebase.sign_in_provider === 'password';
if (isEmailProvider && !decodedToken.email_verified) {
    return NextResponse.json({
        error: 'Vui lòng xác minh email trước khi đăng nhập'
    }, { status: 403 });
}


        try {
            const userRef = db.collection('users').doc(decodedToken.uid);
            const userSnap = await userRef.get();
            console.log('USER EXISTS:', userSnap.exists);

            if (!userSnap.exists) {
                await userRef.set({
                    uid: decodedToken.uid,
                    email: decodedToken.email || null,
                    name: decodedToken.name || null,
                    avatar: decodedToken.picture || null,
                    provider: decodedToken.firebase.sign_in_provider,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                });
                console.log('USER CREATED OK');
            } else {
                await userRef.update({
                    lastLogin: new Date().toISOString(),
                });
                console.log('USER UPDATED OK');
            }
        } catch (dbError) {
            console.error('FIRESTORE ERROR:', dbError);
        }

        const expiresIn = 60 * 60 * 24 * 7 * 1000;
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        const response = NextResponse.json(
            { message: 'Đăng nhập thành công!', uid: decodedToken.uid },
            { status: 200 }
        );

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
        return NextResponse.json({ error: firebaseErrors[error.code] || 'Đăng nhập thất bại' }, { status: 401 });
    }
}