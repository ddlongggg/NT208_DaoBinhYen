import { NextRequest, NextResponse } from 'next/server';
import { ONBOARDING_COOKIE } from './app/lib/onboarding';

const publicRoutes = new Set([
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
]);

const publicPrefixes = [
    '/api',
    '/_next',
];

function isPublicRoute(pathname: string) {
    if (publicRoutes.has(pathname)) return true;
    return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    const session = request.cookies.get('session')?.value;
    if (session) {
        const onboardingStep = request.cookies.get(ONBOARDING_COOKIE)?.value;

        if (!onboardingStep) {
            const isRequiredFlowPage = pathname === '/survey' || pathname === '/daily-checkin';

            if (!isRequiredFlowPage) {
                return NextResponse.redirect(new URL('/survey', request.url));
            }
        }

        if (onboardingStep === 'survey' && pathname !== '/survey') {
            return NextResponse.redirect(new URL('/survey', request.url));
        }

        if (onboardingStep === 'daily') {
            const isDailyPage = pathname === '/daily-checkin';
            const isForcedSurvey = pathname === '/survey' && !!searchParams.get('topic');

            if (!isDailyPage && !isForcedSurvey) {
                return NextResponse.redirect(new URL('/daily-checkin', request.url));
            }
        }

        return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|mp3|wav|css|js|map)$).*)',
    ],
};
