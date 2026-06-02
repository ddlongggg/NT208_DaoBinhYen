import { NextResponse } from 'next/server';
import { ONBOARDING_COOKIE } from '@/app/lib/onboarding';

export async function POST() {
    const response = NextResponse.json({ message: 'Đăng xuất thành công' });
    response.cookies.set('session', '', {
        maxAge: 0,
        path: '/',
    });
    response.cookies.set(ONBOARDING_COOKIE, '', {
        maxAge: 0,
        path: '/',
    });
    return response;
}
